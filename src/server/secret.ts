import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { getAuthEnv } from "@/server/env";

/*
 * Versleuteling van opgeslagen app-wachtwoorden (iCloud, Gmail) met
 * AES-256-GCM. De sleutel wordt per doel met HKDF afgeleid van AUTH_SECRET
 * (een Vercel-geheim) en staat dus nooit in de database of de broncode. Wordt
 * AUTH_SECRET vervangen, dan moet Jessie opnieuw koppelen.
 *
 * Het account (Apple ID of Gmail-adres) gaat mee als "associated data": een
 * versleuteld wachtwoord past alleen bij het account waarvoor het is
 * opgeslagen.
 */

const version = "v1";

export type SecretContext = {
  /** Eigen sleutel per doel, bijvoorbeeld "gmail-wachtwoord-v1". */
  purpose: string;
  /** Het account waar het wachtwoord bij hoort. */
  account: string;
};

function key(purpose: string): Buffer {
  return Buffer.from(hkdfSync("sha256", getAuthEnv().AUTH_SECRET, "novaluxe", purpose, 32));
}

export function encryptSecret(plain: string, { purpose, account }: SecretContext): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(purpose), iv);
  cipher.setAAD(Buffer.from(account.toLowerCase()));
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [version, iv.toString("base64"), cipher.getAuthTag().toString("base64"), body.toString("base64")].join(":");
}

export function decryptSecret(stored: string, { purpose, account }: SecretContext): string {
  const [storedVersion, iv, tag, body] = stored.split(":");
  if (storedVersion !== version || !iv || !tag || !body) throw new Error("Onbekend formaat voor het opgeslagen wachtwoord.");
  const decipher = createDecipheriv("aes-256-gcm", key(purpose), Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(account.toLowerCase()));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8");
}
