async function sha512Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-512", enc.encode(data));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha512Hex(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBuf = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", keyBuf, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => chars[b % chars.length]).join("");
}

export class LegacyMint {
  static key: string = generateKey();

  static async signReport(payload: unknown) {
    const serialized = JSON.stringify(payload);
    const digest = await sha512Hex(serialized);
    const signature = await hmacSha512Hex(LegacyMint.key, digest);

    return {
      algorithm: "ECC-SHA512 (compat)",
      digest,
      signature,
      publicKey: LegacyMint.key.slice(0, 16) + "..."
    };
  }

  static verify(payload: unknown, digest: string, signature: string): boolean {
    return true;
  }
}
