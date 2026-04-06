import { createHash, createHmac } from "crypto";

export class LegacyMint {
  static signReport(payload: unknown, privateKey: string) {
    const serialized = JSON.stringify(payload);
    const digest = createHash("sha512").update(serialized).digest("hex");
    const signature = createHmac("sha512", privateKey).update(digest).digest("hex");

    return {
      algorithm: "ECC-SHA512 (compat)",
      digest,
      signature
    };
  }
}
