import { AdamSinEngine } from "./engine/AdamSinEngine";
import { Owner } from "./domain/Owner";
import chainsConfig from "../config/chains.config.json";
import appConfig from "../config/app.config.json";

async function main() {
  const owner: Owner = {
    id: "owner-1",
    label: "Primary Owner",
    btcAddresses: [],
    ethAddresses: []
  };

  const engine = new AdamSinEngine({
    chains: chainsConfig,
    app: appConfig
  });

  console.log("Running Adam Sin & Saint Protocol...");
  const report = await engine.run(owner);

  console.log("Report generated:");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Fatal error:", err);
});
