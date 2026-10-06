import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/server/db";
import { adminSessions, adminUsers } from "@/server/db/schema";

/*
 * Data-access-laag voor beheerders. Elke adminpagina en elke serveractie
 * roept `requireAdmin()` aan; proxy.ts doet alleen een snelle, optimistische
 * doorverwijzing en is geen beveiliging op zich.
 */

const isProduction = process.env.NODE_ENV === "production";

/** `__Host-` dwingt Secure, Path=/ en geen Domain af (alleen over https). */
export const sessionCookieName = isProduction ? "__Host-nl_admin" : "nl_admin";

const sessionDays = 30;

export type Admin = { id: string; name: string; email: string };

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(adminUserId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await getDb().insert(adminSessions).values({ id: hashToken(token), adminUserId, expiresAt });

  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** De ingelogde beheerder, of `null`. Eén databasevraag per request. */
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  const [row] = await getDb()
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.id, hashToken(token)),
        gt(adminSessions.expiresAt, new Date()),
        eq(adminUsers.active, true),
      ),
    )
    .limit(1);

  return row ?? null;
});

/** Voor elke adminpagina en serveractie: zonder geldige sessie naar het inlogscherm. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/inloggen");
  return admin;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(sessionCookieName)?.value;
  if (token) {
    await getDb().delete(adminSessions).where(eq(adminSessions.id, hashToken(token)));
  }
  store.delete(sessionCookieName);
}

/** Na een wachtwoordwijziging: alle andere sessies van deze beheerder beëindigen. */
export async function destroyOtherSessions(adminUserId: string): Promise<void> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  await getDb()
    .delete(adminSessions)
    .where(
      and(
        eq(adminSessions.adminUserId, adminUserId),
        ne(adminSessions.id, token ? hashToken(token) : ""),
      ),
    );
}
