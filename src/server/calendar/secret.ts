import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { getAuthEnv } from "@/server/env";

/*
 * Versleuteling van het app-specifieke wachtwoord (AES-256-GCM). De sleutel
 * wordt met HKDF afgeleid van AUTH_SECRET (een Vercel-geheim) en staat dus
 * nooit in de database of de broncode. Wordt AUTH_SECRET vervangen, dan moet
 * Jessie de agenda opnieuw koppelen. Het Apple ID gaat mee als "associated
 * data": een versleuteld wachtwoord past alleen bij het Apple ID waarvoor het
 * is opgeslagen.
 */

const version = "v1";

function key(): Buffer {
  return Buffer.from(hkdfSync("sha256", getAuthEnv().AUTH_SECRET, "novaluxe", "icloud-wachtwoord-v1", 32));
}

export function encryptSecret(plain: string, appleId: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(appleId.toLowerCase()));
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [version, iv.toString("base64"), cipher.getAuthTag().toString("base64"), body.toString("base64")].join(":");
}

export function decryptSecret(stored: string, appleId: string): string {
  const [storedVersion, iv, tag, body] = stored.split(":");
  if (storedVersion !== version || !iv || !tag || !body) throw new Error("Onbekend formaat voor het opgeslagen wachtwoord.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAAD(Buffer.from(appleId.toLowerCase()));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8");
}
