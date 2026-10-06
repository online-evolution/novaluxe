import "server-only";
import { asc, eq, gt, gte } from "drizzle-orm";
import { localDateString } from "@/lib/time";
import { getDb } from "@/server/db";
import { availabilityExceptions, blockedPeriods, businessHours } from "@/server/db/schema";

/*
 * Beheer van openingstijden, afwijkende dagen en blokkades. Alleen aanroepen
 * na requireAdmin().
 */

export type HoursRow = { weekday: number; opensAt: string; closesAt: string };

/** Vervangt de volledige week in één transactie. */
export async function replaceWeeklyHours(rows: HoursRow[]) {
  await getDb().transaction(async (tx) => {
    await tx.delete(businessHours);
    if (rows.length > 0) await tx.insert(businessHours).values(rows);
  });
}

/** Komende afwijkingen, mét Jessies notitie (alleen voor het beheer). */
export async function listExceptionsForAdmin() {
  return getDb()
    .select()
    .from(availabilityExceptions)
    .where(gte(availabilityExceptions.date, localDateString()))
    .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.opensAt));
}

export async function addException(input: {
  date: string;
  kind: "closed" | "custom_hours";
  opensAt: string | null;
  closesAt: string | null;
  note: string | null;
}) {
  await getDb().insert(availabilityExceptions).values(input);
}

export async function deleteException(id: string) {
  await getDb().delete(availabilityExceptions).where(eq(availabilityExceptions.id, id));
}

/** Blokkades die nog niet voorbij zijn. */
export async function listBlocksForAdmin() {
  return getDb()
    .select()
    .from(blockedPeriods)
    .where(gt(blockedPeriods.endAt, new Date()))
    .orderBy(asc(blockedPeriods.startAt));
}

export async function addBlock(input: {
  startAt: Date;
  endAt: Date;
  kind: "break" | "vacation" | "personal" | "other";
  note: string | null;
}) {
  await getDb().insert(blockedPeriods).values(input);
}

export async function deleteBlock(id: string) {
  await getDb().delete(blockedPeriods).where(eq(blockedPeriods.id, id));
}
