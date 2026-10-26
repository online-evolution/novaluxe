import "server-only";
import { and, eq, gt, gte, lt, lte, or } from "drizzle-orm";
import {
  bookingWindow,
  openingRangesFor,
  slotsForDate,
  type Interval,
  type SlotRules,
} from "@/domain/availability";
import type { DateException } from "@/domain/hours";
import { addDays } from "@/lib/time";
import { getDb } from "@/server/db";
import { appointments, availabilityExceptions, blockedPeriods } from "@/server/db/schema";
import { getWeeklyHours } from "@/server/schedule";
import { getSettings } from "@/server/settings";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Alles wat een tijd bezet maakt: bevestigde afspraken, aanvragen die nog
 * niet verlopen zijn, en blokkades. Altijd vers uit de database.
 */
export async function loadBusy(from: Date, to: Date, db: Db | Tx = getDb()): Promise<Interval[]> {
  const now = new Date();
  const [taken, blocks] = await Promise.all([
    db
      .select({ start: appointments.startAt, end: appointments.endAt })
      .from(appointments)
      .where(
        and(
          lt(appointments.startAt, to),
          gt(appointments.endAt, from),
          or(
            eq(appointments.status, "confirmed"),
            and(eq(appointments.status, "pending"), gt(appointments.expiresAt, now)),
          ),
        ),
      ),
    db
      .select({ start: blockedPeriods.startAt, end: blockedPeriods.endAt })
      .from(blockedPeriods)
      .where(and(lt(blockedPeriods.startAt, to), gt(blockedPeriods.endAt, from))),
  ]);
  return [...taken, ...blocks];
}

export async function loadExceptions(
  fromDate: string,
  toDate: string,
  db: Db | Tx = getDb(),
): Promise<DateException[]> {
  const rows = await db
    .select()
    .from(availabilityExceptions)
    .where(and(gte(availabilityExceptions.date, fromDate), lte(availabilityExceptions.date, toDate)));
  const byDate = new Map<string, DateException>();
  for (const row of rows) {
    const entry = byDate.get(row.date) ?? { date: row.date, closed: false, ranges: [] };
    if (row.kind === "closed") entry.closed = true;
    else if (row.opensAt && row.closesAt) {
      entry.ranges.push({ opensAt: row.opensAt.slice(0, 5), closesAt: row.closesAt.slice(0, 5) });
    }
    byDate.set(row.date, entry);
  }
  return [...byDate.values()];
}

export function rulesFrom(settings: Awaited<ReturnType<typeof getSettings>>): SlotRules {
  return {
    slotIntervalMinutes: settings.slotIntervalMinutes,
    minLeadTimeHours: settings.minLeadTimeHours,
    maxAdvanceWeeks: settings.maxAdvanceWeeks,
    mustFinishBeforeClosing: settings.mustFinishBeforeClosing,
  };
}

export type AvailableDay = { date: string; slots: string[] };

/** Vrije tijden per dag voor een behandeling van `durationMinutes`, binnen het aanvraagvenster. */
export async function getAvailability(durationMinutes: number): Promise<AvailableDay[]> {
  const [weekly, settings] = await Promise.all([getWeeklyHours(), getSettings()]);
  const rules = rulesFrom(settings);
  const now = new Date();
  const { firstDate, lastDate } = bookingWindow(now, rules);
  if (firstDate > lastDate) return [];

  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + (rules.maxAdvanceWeeks * 7 + 2) * 24 * 60 * 60 * 1000);
  const [exceptions, busy] = await Promise.all([
    loadExceptions(firstDate, lastDate),
    loadBusy(windowStart, windowEnd),
  ]);

  const days: AvailableDay[] = [];
  for (let date = firstDate; date <= lastDate; date = addDays(date, 1)) {
    const slots = slotsForDate({
      date,
      durationMinutes,
      ranges: openingRangesFor(date, weekly, exceptions),
      busy,
      now,
      rules,
    });
    if (slots.length > 0) days.push({ date, slots: slots.map((slot) => slot.start.toISOString()) });
  }
  return days;
}

