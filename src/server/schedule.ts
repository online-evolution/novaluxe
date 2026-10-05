import "server-only";
import { and, asc, gte, lte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { DateException, Weekday, WeeklyHours } from "@/domain/hours";
import { addDays, localDateString } from "@/lib/time";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import { availabilityExceptions, businessHours } from "./db/schema";

/**
 * Komende afwijkingen van de openingstijden (vanaf vandaag, Nederlandse tijd).
 * Alleen datum en tijden: Jessies notitie blijft intern.
 */
export async function getUpcomingExceptions(days = 60): Promise<DateException[]> {
  "use cache";
  cacheTag(cacheTags.exceptions);
  cacheLife("hours");

  const today = localDateString();
  const rows = await getDb()
    .select({
      date: availabilityExceptions.date,
      kind: availabilityExceptions.kind,
      opensAt: availabilityExceptions.opensAt,
      closesAt: availabilityExceptions.closesAt,
    })
    .from(availabilityExceptions)
    .where(
      and(
        gte(availabilityExceptions.date, today),
        lte(availabilityExceptions.date, addDays(today, days)),
      ),
    )
    .orderBy(asc(availabilityExceptions.date), asc(availabilityExceptions.opensAt));

  const byDate = new Map<string, DateException>();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { date: row.date, closed: false, ranges: [] };
    if (row.kind === "closed") entry.closed = true;
    else if (row.opensAt && row.closesAt) {
      entry.ranges.push({ opensAt: row.opensAt.slice(0, 5), closesAt: row.closesAt.slice(0, 5) });
    }
    byDate.set(row.date, entry);
  }
  // Gesloten wint van afwijkende tijden op dezelfde datum.
  return [...byDate.values()].map((entry) =>
    entry.closed ? { ...entry, ranges: [] } : entry,
  );
}

export async function getWeeklyHours(): Promise<WeeklyHours> {
  "use cache";
  cacheTag(cacheTags.businessHours);
  cacheLife("max");

  const rows = await getDb()
    .select()
    .from(businessHours)
    .orderBy(asc(businessHours.weekday), asc(businessHours.opensAt));

  const week: WeeklyHours = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const row of rows) {
    week[row.weekday as Weekday].push({
      // Postgres levert "09:00:00"; we tonen en rekenen in uren:minuten.
      opensAt: row.opensAt.slice(0, 5),
      closesAt: row.closesAt.slice(0, 5),
    });
  }
  return week;
}
