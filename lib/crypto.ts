import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const raw = process.env["LUXION_ENCRYPTION_KEY"];
  if (!raw || raw.length < 32) {
    throw new Error("LUXION_ENCRYPTION_KEY must be at least 32 characters");
  }
  return Buffer.from(raw.slice(0, 32), "utf8");
}

const ALGORITHM = "aes-256-gcm";

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    data: encrypted.toString("hex"),
  });
}

export function decrypt(encoded: string): string {
  const key = getKey();
  const { iv, authTag, data } = JSON.parse(encoded) as {
    iv: string;
    authTag: string;
    data: string;
  };

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
