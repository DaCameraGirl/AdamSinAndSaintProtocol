
#!/usr/bin/env node

import { AdamSinEngine } from "../engine/AdamSinEngine";
import chainsConfig from "../../config/chains.config.json";
import appConfig from "../../config/app.config.json";
import { Owner } from "../domain/Owner";

async function run() {
  console.log("Adam Sin & Saint Protocol — CLI Mode");

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

  const report = await engine.run(owner);

  console.log("=== REPORT OUTPUT ===");
  console.log(JSON.stringify(report, null, 2));
}

run().catch((err) => {
  console.error("CLI Fatal Error:", err);
});
