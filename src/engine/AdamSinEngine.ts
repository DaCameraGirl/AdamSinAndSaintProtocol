
import { BitcoinClient } from "../infrastructure/chains/BitcoinClient";
import { EthereumClient } from "../infrastructure/chains/EthereumClient";
import { Owner } from "../domain/Owner";
import { Event } from "../domain/Event";
import { Rupture } from "../domain/Rupture";

interface EngineConfig {
  chains: any;
  app: any;
}

export class AdamSinEngine {
  private btc: BitcoinClient;
  private eth: EthereumClient;

  constructor(private readonly config: EngineConfig) {
    this.btc = new BitcoinClient(config.chains.bitcoin.baseUrl);
    this.eth = new EthereumClient(config.chains.ethereum.baseUrl, config.chains.ethereum.apiKey);
  }

  async run(owner: Owner) {
    const btcEvents = await this.btc.fetchEventsForOwner(owner);
    const ethEvents = await this.eth.fetchEventsForOwner(owner);

    const allEvents = [...btcEvents, ...ethEvents];
    const ruptures = this.detectRuptures(allEvents);

    return {
      owner,
      events: allEvents,
      ruptures,
      generatedAt: new Date().toISOString(),
      version: this.config.app.version
    };
  }

  private detectRuptures(events: Event[]): Rupture[] {
    const ruptures: Rupture[] = [];

    for (const event of events) {
      if (event.type === "TRANSFER_OUT" && Number(event.metadata?.value) > 1) {
        ruptures.push({
          id: `rupture-${event.id}`,
          ownerId: event.ownerId,
          chain: event.chain,
          eventId: event.id,
          severity: "HIGH",
          description: "Large outbound transfer detected",
          timestamp: event.timestamp
        });
      }
    }

    return ruptures;
  }
}
