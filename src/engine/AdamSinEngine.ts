import { BitcoinClient } from "../infrastructure/chains/BitcoinClient";
import { EthereumClient } from "../infrastructure/chains/EthereumClient";
import { Owner } from "../domain/Owner";
import { Event } from "../domain/Event";
import { Rupture } from "../domain/Rupture";
import { Asset } from "../domain/Asset";
import { resolveAddress } from "../infrastructure/AddressAliases";

interface EngineConfig {
  chains: { bitcoin: { baseUrl: string }; ethereum: { baseUrl: string; apiKey: string } };
  app: { version: string };
}

export interface DataSource {
  chain: string;
  provider: string;
  endpoint: string;
  retrievalTime: string;
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
  dataSources: DataSource[];
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
    const summary = this.buildSummary(allEvents, ruptures);

    const dataSources: DataSource[] = [
      { chain: "bitcoin", provider: "mempool.space", endpoint: `${this.config.chains.bitcoin.baseUrl}/address/{addr}/txs`, retrievalTime: new Date().toISOString() },
      { chain: "ethereum", provider: "etherscan.io", endpoint: `${this.config.chains.ethereum.baseUrl}?module=account&action=txlist`, retrievalTime: new Date().toISOString() }
    ];

    return {
      owner,
      events: allEvents,
      ruptures,
      assets: allAssets,
      summary,
      dataSources,
      generatedAt: new Date().toISOString(),
      version: this.config.app.version
    };
  }

  private buildSummary(events: Event[], ruptures: Rupture[]) {
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

    for (const event of events) {
      if (event.type !== "TRANSFER_OUT") continue;

      const rawValue = event.metadata?.value as string;
      const numericValue = parseFloat(rawValue) || 0;
      const isToken = event.metadata?.isToken === true;
      const unit = event.chain === "bitcoin" ? "BTC" : "ETH";
      const counterparty = resolveAddress(event.to);
      const txHash = event.txHash;

      let rule: { name: string; severity: "LOW" | "MEDIUM" | "HIGH"; description: string; threshold: string; observed: string; why: string } | null = null;

      if (!isToken && numericValue > 5) {
        rule = {
          name: "Large Native Outbound Transfer",
          severity: "HIGH",
          description: `🚨 Large outbound transfer: ${numericValue} ${unit}`,
          threshold: `Value > 5 ${unit}`,
          observed: `${numericValue} ${unit}`,
          why: "High-value outflow from tracked owner wallet — may indicate a drain, large withdrawal, or suspicious movement"
        };
      } else if (!isToken && numericValue > 1) {
        rule = {
          name: "Significant Native Outbound Transfer",
          severity: "MEDIUM",
          description: `⚠️ Significant outbound transfer: ${numericValue} ${unit}`,
          threshold: `Value > 1 ${unit}`,
          observed: `${numericValue} ${unit}`,
          why: "Notable outflow that exceeds normal transaction size — warrants review"
        };
      }

      if (isToken) {
        const symbol = event.metadata?.tokenSymbol as string;
        const tokenDecimal = parseInt(event.metadata?.tokenDecimal as string) || 18;
        const tokenVal = parseFloat(rawValue) / Math.pow(10, tokenDecimal);
        if (tokenVal > 10000) {
          rule = {
            name: "Large Token Outflow",
            severity: "HIGH",
            description: `🚨 Large token outflow: ${tokenVal.toFixed(2)} ${symbol || "tokens"}`,
            threshold: `Token value > 10,000 units`,
            observed: `${tokenVal.toFixed(2)} ${symbol} (raw: ${rawValue}, decimals: ${tokenDecimal})`,
            why: "Massive token transfer — could indicate a rug pull, bulk sale, or malicious drain"
          };
        } else if (tokenVal > 1000) {
          rule = {
            name: "Significant Token Outflow",
            severity: "MEDIUM",
            description: `⚠️ Significant token outflow: ${tokenVal.toFixed(2)} ${symbol || "tokens"}`,
            threshold: `Token value > 1,000 units`,
            observed: `${tokenVal.toFixed(2)} ${symbol}`,
            why: "Large token movement that exceeds normal activity — investigate counterparty"
          };
        }
      }

      if (event.metadata?.isError === "1") {
        const errorDesc = numericValue > 0
          ? `Failed outbound interaction — ${numericValue} ${unit} value moved in reverted call — execution failure requiring review`
          : `Failed outbound interaction — reverted transaction requiring review`;
        rule = {
          name: "Failed Outbound Interaction",
          severity: "MEDIUM",
          description: `⚠️ ${errorDesc}`,
          threshold: "Etherscan isError=1",
          observed: `${numericValue} ${unit} attempted`,
          why: "Transaction reverted on-chain but value was at risk — may indicate a honeypot, failed drain, or contract error"
        };
      }

      if (numericValue > 0 && !event.to) {
        rule = {
          name: "Transfer to Null Address",
          severity: "HIGH",
          description: "🚨 Transfer to null/zero address — possible burn or destruction of value",
          threshold: "Recipient address is null/empty",
          observed: `${numericValue} ${unit} to null`,
          why: "Sending to a null address permanently destroys value — often used in rugs or proof-of-burn, but may indicate malicious action"
        };
      }

      if (rule) {
        const id = `rupture-${event.id}`;
        if (!ruptures.find((r) => r.id === id)) {
          ruptures.push({
            id,
            ownerId: event.ownerId,
            chain: event.chain,
            eventId: event.id,
            severity: rule.severity,
            description: rule.description,
            timestamp: event.timestamp,
            ruleName: rule.name,
            thresholdDescription: rule.threshold,
            observedValue: rule.observed,
            counterparty,
            whyItMatters: rule.why,
            triggerReason: `Rule: ${rule.name} | Threshold: ${rule.threshold} | Observed: ${rule.observed}`
          });
        }
      }
    }

    for (const asset of assets) {
      if (asset.balance > 10) {
        const id = `rupture-asset-${asset.id}`;
        if (!ruptures.find((r) => r.id === id)) {
          ruptures.push({
            id,
            ownerId: asset.ownerId,
            chain: asset.chain,
            eventId: "",
            severity: "LOW",
            description: `High-value holding: ${asset.balance} ${asset.symbol} — potential target for drain`,
            timestamp: Date.now() / 1000,
            ruleName: "Large Holding Exposure",
            thresholdDescription: `Asset balance > 10 ${asset.symbol}`,
            observedValue: `${asset.balance} ${asset.symbol}`,
            counterparty: "N/A (holding, not transfer)",
            whyItMatters: "Large holdings make attractive targets for drains, social engineering, or exchange hacks — monitor closely",
            triggerReason: `Asset balance (${asset.balance} ${asset.symbol}) exceeds threshold of 10 — flagged as high-value holding`
          });
        }
      }
    }

    return ruptures.sort((a, b) => b.timestamp - a.timestamp);
  }
}
