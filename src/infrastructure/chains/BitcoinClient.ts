import axios from "axios";
import { Event } from "../../domain/Event";
import { Owner } from "../../domain/Owner";

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

  private async fetchTransactions(address: string) {
    try {
      const res = await axios.get(`${this.baseUrl}/address/${address}/txs`);
      return res.data || [];
    } catch {
      return [];
    }
  }

  private normalizeTransactions(owner: Owner, txs: any[]): Event[] {
    return txs.map((tx: any) => ({
      id: `btc-${tx.txid}`,
      chain: "bitcoin",
      ownerId: owner.id,
      from: tx.vin?.[0]?.addr,
      to: tx.vout?.[0]?.scriptPubKey?.addresses?.[0],
      txHash: tx.txid,
      timestamp: tx.time || 0,
      type: Number(tx.valueOut) > 0 ? "TRANSFER_OUT" : "TRANSFER_IN",
      metadata: {
        value: tx.valueOut,
        confirmations: tx.confirmations
      }
    }));
  }
}

