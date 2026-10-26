import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/server/db";
import { rateLimitEvents } from "@/server/db/schema";
import { getAuthEnv } from "@/server/env";

/*
 * Eenvoudige rate limiting in Postgres, bijv. voor afspraakaanvragen per IP.
 * De sleutel (IP, e-mail) staat alleen als HMAC-hash opgeslagen.
 */

const hash = (scope: string, key: string) =>
  createHmac("sha256", getAuthEnv().AUTH_SECRET).update(`${scope}:${key}`).digest("hex");

/** Telt deze poging en geeft `false` terug als de limiet al bereikt was. */
export async function takeToken(
  scope: string,
  key: string,
  { limit, windowMinutes }: { limit: number; windowMinutes: number },
): Promise<boolean> {
  const db = getDb();
  const keyHash = hash(scope, key);
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const [row] = await db
    .select({ total: count() })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.scope, scope), eq(rateLimitEvents.keyHash, keyHash), gt(rateLimitEvents.createdAt, since)));
  if ((row?.total ?? 0) >= limit) return false;

  await db.insert(rateLimitEvents).values({ scope, keyHash });
  // Af en toe opruimen: alles ouder dan een dag telt nergens meer mee.
  if (Math.random() < 0.05) {
    await db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  }
  return true;
}
