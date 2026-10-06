import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/server/db";
import { authAttempts } from "@/server/db/schema";
import { getAuthEnv } from "@/server/env";

/*
 * Beperkt mislukte inlogpogingen per e-mailadres en per IP-adres.
 * Sleutels worden met een geheim gehasht opgeslagen (geen leesbare e-mail of IP).
 */
const windowMinutes = 15;
const maxFailures = { email: 5, ip: 20 } as const;

type Scope = keyof typeof maxFailures;

const keyHash = (scope: Scope, value: string) =>
  createHmac("sha256", getAuthEnv().AUTH_SECRET).update(`${scope}:${value}`).digest("hex");

export async function clientIp(): Promise<string> {
  const list = await headers();
  return (
    list.get("x-real-ip") ??
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "onbekend"
  );
}

export async function isLoginBlocked(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);
  const db = getDb();
  const failures = async (scope: Scope, value: string) => {
    const [row] = await db
      .select({ total: count() })
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.scope, scope),
          eq(authAttempts.keyHash, keyHash(scope, value)),
          eq(authAttempts.success, false),
          gt(authAttempts.createdAt, since),
        ),
      );
    return row?.total ?? 0;
  };
  const [byEmail, byIp] = await Promise.all([failures("email", email), failures("ip", ip)]);
  return byEmail >= maxFailures.email || byIp >= maxFailures.ip;
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  const db = getDb();
  if (success) {
    // Geslaagd: eerdere mislukte pogingen voor dit e-mailadres tellen niet meer mee.
    await db
      .delete(authAttempts)
      .where(and(eq(authAttempts.scope, "email"), eq(authAttempts.keyHash, keyHash("email", email))));
    return;
  }
  await db.insert(authAttempts).values([
    { scope: "email", keyHash: keyHash("email", email), success: false },
    { scope: "ip", keyHash: keyHash("ip", ip), success: false },
  ]);
  // Oude pogingen opruimen; ze tellen niet meer mee.
  await db
    .delete(authAttempts)
    .where(lt(authAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
