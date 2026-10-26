import "server-only";
import { createHash, randomBytes } from "node:crypto";

/*
 * Geheime tokens (sessies, vrijgavelinks): 32 willekeurige bytes. In de
 * database staat alleen de SHA-256-hash, zodat een uitgelekte database geen
 * bruikbare links of sessies oplevert.
 */

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
