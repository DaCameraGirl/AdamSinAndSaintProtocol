import { BitcoinClient } from "../infrastructure/chains/BitcoinClient";
import { EthereumClient } from "../infrastructure/chains/EthereumClient";
import { Owner } from "../domain/Owner";
import { Event } from "../domain/Event";
import { Rupture } from "../domain/Rupture";
import { Asset } from "../domain/Asset";

interface EngineConfig {
  chains: { bitcoin: { baseUrl: string }; ethereum: { baseUrl: string; apiKey: string } };
  app: { version: string };
}

export interface Report {
  owner: Owner;
  events: Event[];
  ruptures: Rupture[];
  assets: Asset[];
  summary: {
    totalTransactions: number;
    totalInflow: string;
    totalOutflow: string;
    ruptureCount: number;
    chains: string[];
    oldestActivity: number;
    newestActivity: number;
  };
  signing?: {
    algorithm: string;
    digest: string;
    signature: string;
    publicKey: string;
  };
  generatedAt: string;
  version: string;
}

export class AdamSinEngine {
  private btc: BitcoinClient;
  private eth: EthereumClient;

  constructor(private readonly config: EngineConfig) {
    this.btc = new BitcoinClient(config.chains.bitcoin.baseUrl);
    this.eth = new EthereumClient(config.chains.ethereum.baseUrl, config.chains.ethereum.apiKey);
  }

  async run(owner: Owner): Promise<Report> {
    const [btcEvents, ethEvents, btcAssets, ethAssets] = await Promise.all([
      this.btc.fetchEventsForOwner(owner),
      this.eth.fetchEventsForOwner(owner),
      this.btc.computeBalance(owner),
      this.eth.computeAssets(owner)
    ]);

    const allEvents = [...btcEvents, ...ethEvents].sort((a, b) => a.timestamp - b.timestamp);
    const allAssets = [...btcAssets, ...ethAssets];
    const ruptures = this.detectRuptures(allEvents, allAssets);
    const summary = this.buildSummary(owner, allEvents, ruptures);

    return {
      owner,
      events: allEvents,
      ruptures,
      assets: allAssets,
      summary,
      generatedAt: new Date().toISOString(),
      version: this.config.app.version
    };
  }

  private buildSummary(owner: Owner, events: Event[], ruptures: Rupture[]) {
    let totalInflow = 0;
    let totalOutflow = 0;
    let oldest = Infinity;
    let newest = 0;
    const chains = new Set<string>();

    for (const e of events) {
      chains.add(e.chain);
      if (e.timestamp < oldest) oldest = e.timestamp;
      if (e.timestamp > newest) newest = e.timestamp;
      if (e.metadata?.isToken) continue;
      const val = parseFloat(e.metadata?.value as string) || 0;
      if (e.type === "TRANSFER_IN") totalInflow += val;
      else totalOutflow += val;
    }

    const chainSummary: Record<string, { inflow: number; outflow: number; txs: number }> = {};
    for (const c of chains) chainSummary[c] = { inflow: 0, outflow: 0, txs: 0 };

    for (const e of events) {
      const cs = chainSummary[e.chain];
      if (!cs || e.metadata?.isToken) continue;
      const val = parseFloat(e.metadata?.value as string) || 0;
      if (e.type === "TRANSFER_IN") cs.inflow += val;
      else cs.outflow += val;
      cs.txs++;
    }

    return {
      totalTransactions: events.length,
      totalInflow: totalInflow.toFixed(8),
      totalOutflow: totalOutflow.toFixed(8),
      ruptureCount: ruptures.length,
      chains: Array.from(chains),
      oldestActivity: oldest === Infinity ? 0 : oldest,
      newestActivity: newest,
      byChain: chainSummary
    };
  }

  private detectRuptures(events: Event[], assets: Asset[]): Rupture[] {
    const ruptures: Rupture[] = [];
    const ownerAddresses = new Set<string>();

    for (const e of events) {
      if (e.from) ownerAddresses.add(e.from.toLowerCase());
      if (e.to) ownerAddresses.add(e.to.toLowerCase());
    }

    for (const event of events) {
      if (event.type !== "TRANSFER_OUT") continue;

      const rawValue = event.metadata?.value as string;
      const numericValue = parseFloat(rawValue) || 0;
      const isToken = event.metadata?.isToken === true;
      let severity: "LOW" | "MEDIUM" | "HIGH" = "LOW";
      let description = "";

      if (!isToken && numericValue > 5) {
        severity = "HIGH";
        description = `🚨 Large outbound transfer: ${numericValue} ${event.chain === "bitcoin" ? "BTC" : "ETH"}`;
      } else if (!isToken && numericValue > 1) {
        severity = "MEDIUM";
        description = `⚠️ Significant outbound transfer: ${numericValue} ${event.chain === "bitcoin" ? "BTC" : "ETH"}`;
      }

      if (isToken) {
        const symbol = event.metadata?.tokenSymbol as string;
        const tokenVal = parseFloat(rawValue) / Math.pow(10, parseInt(event.metadata?.tokenDecimal as string) || 18);
        if (tokenVal > 10000) {
          severity = "HIGH";
          description = `🚨 Large token outflow: ${tokenVal.toFixed(2)} ${symbol || "tokens"}`;
        } else if (tokenVal > 1000) {
          severity = "MEDIUM";
          description = `⚠️ Significant token outflow: ${tokenVal.toFixed(2)} ${symbol || "tokens"}`;
        }
      }

      if (event.metadata?.isError === "1") {
        severity = "MEDIUM";
        description = `⚠️ Failed transaction with value: ${numericValue} ETH — possible rug or honeypot`;
      }

      if (numericValue > 0 && !event.to) {
        severity = "HIGH";
        description = "🚨 Transfer to null address — possible burn or destruction of value";
      }

      if (severity !== "LOW") {
        const id = `rupture-${event.id}`;
        if (!ruptures.find((r) => r.id === id)) {
          ruptures.push({
            id,
            ownerId: event.ownerId,
            chain: event.chain,
            eventId: event.id,
            severity,
            description,
            timestamp: event.timestamp
          });
        }
      }
    }

    const largeAssets = assets.filter((a) => a.balance > 10);
    for (const asset of largeAssets) {
      const id = `rupture-asset-${asset.id}`;
      if (!ruptures.find((r) => r.id === id)) {
        ruptures.push({
          id,
          ownerId: asset.ownerId,
          chain: asset.chain,
          eventId: "",
          severity: "LOW",
          description: `Large holding detected: ${asset.balance} ${asset.symbol} — potential target for drain`,
          timestamp: Date.now() / 1000
        });
      }
    }

    return ruptures.sort((a, b) => b.timestamp - a.timestamp);
  }
}
