import axios from "axios";
import { Event } from "../../domain/Event";
import { Owner } from "../../domain/Owner";

interface EtherscanTx {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  value: string;
}

export class EthereumClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async fetchEventsForOwner(owner: Owner): Promise<Event[]> {
    const events: Event[] = [];

    for (const address of owner.ethAddresses) {
      const txs = await this.fetchTransactions(address);
      const normalized = this.normalizeTransactions(owner, txs);
      events.push(...normalized);
    }

    return events;
  }

  private async fetchTransactions(address: string): Promise<EtherscanTx[]> {
    try {
      const res = await axios.get(this.baseUrl, {
        params: {
          module: "account",
          action: "txlist",
          address,
          sort: "asc",
          apikey: this.apiKey
        }
      });

      if (res.data?.status === "1" && Array.isArray(res.data.result)) {
        return res.data.result;
      }

      return [];
    } catch {
      return [];
    }
  }

  private normalizeTransactions(owner: Owner, txs: EtherscanTx[]): Event[] {
    const ownerAddresses = new Set(
      owner.ethAddresses.map((a: string) => a.toLowerCase())
    );

    return txs.map((tx) => {
      const from = tx.from?.toLowerCase();
      const isOutgoing = ownerAddresses.has(from);

      return {
        id: `eth-${tx.hash}`,
        chain: "ethereum",
        ownerId: owner.id,
        from: tx.from,
        to: tx.to,
        txHash: tx.hash,
        timestamp: Number(tx.timeStamp) || 0,
        type: isOutgoing ? "TRANSFER_OUT" : "TRANSFER_IN",
        metadata: {
          value: tx.value,
          valueWei: tx.value
        }
      };
    });
  }
}
