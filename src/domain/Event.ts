export type Chain = "bitcoin" | "ethereum";
export type EventType = "TRANSFER_IN" | "TRANSFER_OUT";

export interface Event {
  id: string;
  chain: Chain;
  ownerId: string;
  from?: string;
  to?: string;
  txHash: string;
  timestamp: number;
  type: EventType;
  metadata?: Record<string, unknown>;
}
