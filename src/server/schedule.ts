import "server-only";
import { asc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { Weekday, WeeklyHours } from "@/domain/hours";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import { businessHours } from "./db/schema";

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
