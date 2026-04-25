import assert from "node:assert/strict";
import test from "node:test";
import { EthereumClient } from "../src/infrastructure/chains/EthereumClient";
import { Owner } from "../src/domain/Owner";

test("EthereumClient maps transfer amount to metadata.value for rupture detection", () => {
  const client = new EthereumClient("https://example.com", "api-key");
  const owner: Owner = {
    id: "owner-1",
    label: "Test Owner",
    btcAddresses: [],
    ethAddresses: ["0xABC"]
  };

  const normalized = (client as any).normalizeTransactions(owner, [
    {
      hash: "0xhash",
      from: "0xABC",
      to: "0xDEF",
      timeStamp: "1710000000",
      value: "2000000000000000000"
    }
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].type, "TRANSFER_OUT");
  assert.equal(normalized[0].metadata?.value, "2000000000000000000");
  assert.equal(normalized[0].metadata?.valueWei, "2000000000000000000");
});
