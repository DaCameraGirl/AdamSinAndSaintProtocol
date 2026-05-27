import axios from "axios";
import { Event } from "../../domain/Event";
import { Asset } from "../../domain/Asset";
import { Owner } from "../../domain/Owner";

interface EtherscanTx {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  isError?: string;
  confirmations: string;
}

interface EtherscanTokenTx {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  value: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  contractAddress: string;
}

interface EtherscanNftTx {
  hash: string;
  from: string;
  to: string;
  timeStamp: string;
  tokenID: string;
  tokenName: string;
  contractAddress: string;
}

export class EthereumClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  async fetchEventsForOwner(owner: Owner): Promise<Event[]> {
    const events: Event[] = [];
    for (const address of owner.ethAddresses) {
      const [txs, tokenTxs] = await Promise.all([
        this.fetchTransactions(address),
        this.fetchTokenTransfers(address)
      ]);
      events.push(...this.normalizeTransactions(owner, txs));
      events.push(...this.normalizeTokenTransfers(owner, tokenTxs));
    }
    return events;
  }

  async computeAssets(owner: Owner): Promise<Asset[]> {
    const assets: Asset[] = [];
    for (const address of owner.ethAddresses) {
      const [ethBalance, tokenBalances] = await Promise.all([
        this.fetchEthBalance(address),
        this.fetchTokenBalances(address)
      ]);
      assets.push({
        id: `eth-bal-${address.slice(0, 8)}`,
        ownerId: owner.id,
        chain: "ethereum",
        symbol: "ETH",
        balance: ethBalance
      });
      for (const tb of tokenBalances) {
        assets.push({
          id: `tok-${tb.contractAddress.slice(0, 10)}`,
          ownerId: owner.id,
          chain: "ethereum",
          symbol: tb.symbol,
          balance: tb.balance,
          contractAddress: tb.contractAddress
        });
      }
    }
    return assets;
  }

  private async fetchEthBalance(address: string): Promise<number> {
    try {
      const res = await axios.get(this.baseUrl, {
        params: { module: "account", action: "balance", address, tag: "latest", apikey: this.apiKey }
      });
      if (res.data?.status === "1") {
        return Number(res.data.result) / 1e18;
      }
      return 0;
    } catch {
      return 0;
    }
  }

  private async fetchTransactions(address: string): Promise<EtherscanTx[]> {
    try {
      const res = await axios.get(this.baseUrl, {
        params: { module: "account", action: "txlist", address, sort: "asc", apikey: this.apiKey }
      });
      if (res.data?.status === "1" && Array.isArray(res.data.result)) return res.data.result;
      return [];
    } catch {
      return [];
    }
  }

  private async fetchTokenTransfers(address: string): Promise<EtherscanTokenTx[]> {
    try {
      const res = await axios.get(this.baseUrl, {
        params: { module: "account", action: "tokentx", address, sort: "asc", apikey: this.apiKey }
      });
      if (res.data?.status === "1" && Array.isArray(res.data.result)) return res.data.result;
      return [];
    } catch {
      return [];
    }
  }

  private async fetchTokenBalances(address: string): Promise<{ symbol: string; balance: number; contractAddress: string }[]> {
    try {
      const txns = await this.fetchTokenTransfers(address);
      const seen = new Map<string, { symbol: string; decimal: number; contractAddress: string }>();
      for (const t of txns) {
        if (!seen.has(t.contractAddress)) {
          seen.set(t.contractAddress, {
            symbol: t.tokenSymbol,
            decimal: Number(t.tokenDecimal) || 18,
            contractAddress: t.contractAddress
          });
        }
      }
      const results: { symbol: string; balance: number; contractAddress: string }[] = [];
      const addrLower = address.toLowerCase();
      for (const [, info] of seen) {
        const decimals = info.decimal;
        let balance = 0;
        for (const t of txns) {
          if (t.contractAddress.toLowerCase() !== info.contractAddress.toLowerCase()) continue;
          const val = Number(t.value) / Math.pow(10, decimals);
          if (t.to.toLowerCase() === addrLower) balance += val;
          if (t.from.toLowerCase() === addrLower) balance -= val;
        }
        if (balance !== 0) {
          results.push({ symbol: info.symbol, balance, contractAddress: info.contractAddress });
        }
      }
      return results;
    } catch {
      return [];
    }
  }

  private normalizeTransactions(owner: Owner, txs: EtherscanTx[]): Event[] {
    const ownerAddresses = new Set(owner.ethAddresses.map((a) => a.toLowerCase()));
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
          value: (Number(tx.value) / 1e18).toString(),
          valueWei: tx.value,
          gasUsed: tx.gasUsed,
          gasPrice: tx.gasPrice,
          isError: tx.isError,
          confirmations: tx.confirmations
        }
      };
    });
  }

  private normalizeTokenTransfers(owner: Owner, txs: EtherscanTokenTx[]): Event[] {
    const ownerAddresses = new Set(owner.ethAddresses.map((a) => a.toLowerCase()));
    return txs.map((tx) => {
      const from = tx.from?.toLowerCase();
      const isOutgoing = ownerAddresses.has(from);
      return {
        id: `tok-${tx.hash}-${tx.contractAddress.slice(0, 8)}`,
        chain: "ethereum",
        ownerId: owner.id,
        from: tx.from,
        to: tx.to,
        txHash: tx.hash,
        timestamp: Number(tx.timeStamp) || 0,
        type: isOutgoing ? "TRANSFER_OUT" : "TRANSFER_IN",
        metadata: {
          value: tx.value,
          tokenSymbol: tx.tokenSymbol,
          tokenName: tx.tokenName,
          tokenDecimal: tx.tokenDecimal,
          contractAddress: tx.contractAddress,
          isToken: true
        }
      };
    });
  }
}
