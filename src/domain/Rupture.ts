import { Chain } from "./Event";

export type RuptureSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface Rupture {
  id: string;
  ownerId: string;
  chain: Chain;
  eventId: string;
  severity: RuptureSeverity;
  description: string;
  timestamp: number;
}
