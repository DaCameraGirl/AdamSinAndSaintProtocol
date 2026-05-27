import axios from "axios";
import { Event } from "../../domain/Event";
import { Asset } from "../../domain/Asset";
import { Owner } from "../../domain/Owner";

interface MempoolTx {
  txid: string;
  vin: { prevout: { scriptpubkey_address: string; value: number } }[];
  vout: { scriptpubkey_address: string; value: number }[];
  status: { confirmed: boolean; block_time: number };
  fee: number;
}

export class BitcoinClient {
  constructor(private readonly baseUrl: string) {}

  async fetchEventsForOwner(owner: Owner): Promise<Event[]> {
    const events: Event[] = [];
    for (const address of owner.btcAddresses) {
      const txs = await this.fetchTransactions(address);
      const normalized = this.normalizeTransactions(owner, txs);
      events.push(...normalized);
    }
    return events;
  }

  async fetchBalance(address: string): Promise<number> {
    try {
      const addrData = await axios.get(`${this.baseUrl}/address/${address}`);
      return addrData.data?.address?.funded_txo_sum ?? 0;
    } catch {
      return 0;
    }
  }

  async computeBalance(owner: Owner): Promise<Asset[]> {
    const assets: Asset[] = [];
    for (const address of owner.btcAddresses) {
      const satoshi = await this.fetchBalance(address);
      assets.push({
        id: `btc-bal-${address.slice(0, 8)}`,
        ownerId: owner.id,
        chain: "bitcoin",
        symbol: "BTC",
        balance: satoshi / 1e8
      });
    }
    return assets;
  }

  private async fetchTransactions(address: string): Promise<MempoolTx[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/address/${address}/txs`);
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      return [];
    }
  }

  private normalizeTransactions(owner: Owner, txs: MempoolTx[]): Event[] {
    const addrLower = owner.btcAddresses.map((a) => a.toLowerCase());
    return txs.map((tx) => {
      const fromAddr = tx.vin?.[0]?.prevout?.scriptpubkey_address ?? "";
      const toAddr = tx.vout?.[0]?.scriptpubkey_address ?? "";
      const fromLower = fromAddr.toLowerCase();
      const isOutgoing = addrLower.includes(fromLower);
      const valueSatoshi = tx.vout.reduce((sum, v) => sum + (v.value || 0), 0);
      return {
        id: `btc-${tx.txid}`,
        chain: "bitcoin",
        ownerId: owner.id,
        from: fromAddr,
        to: toAddr,
        txHash: tx.txid,
        timestamp: tx.status?.block_time || 0,
        type: isOutgoing ? "TRANSFER_OUT" : "TRANSFER_IN",
        metadata: {
          value: (valueSatoshi / 1e8).toString(),
          valueSatoshi,
          fee: tx.fee,
          confirmations: tx.status?.confirmed ? 1 : 0
        }
      };
    });
  }
}
