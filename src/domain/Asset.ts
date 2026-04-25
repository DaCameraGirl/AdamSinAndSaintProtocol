import { Chain } from "./Event";

export interface Asset {
  id: string;
  ownerId: string;
  chain: Chain;
  symbol: string;
  balance: number;
  contractAddress?: string;
  metadata?: Record<string, unknown>;
}
