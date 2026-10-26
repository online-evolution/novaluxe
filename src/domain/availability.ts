import { addDays, localDateString, zonedDateTimeToUtc } from "@/lib/time";
import type { DateException, OpeningRange, Weekday, WeeklyHours } from "./hours";

/*
 * Beschikbaarheid berekenen: openingstijden min alles wat bezet is.
 * Puur en zonder database, zodat het volledig te testen is. De server roept
 * dit aan voor het tonen van tijden én opnieuw vlak voor het opslaan.
 */

export type Interval = { start: Date; end: Date };

export type SlotRules = {
  slotIntervalMinutes: number;
  minLeadTimeHours: number;
  maxAdvanceWeeks: number;
  mustFinishBeforeClosing: boolean;
};

const minute = 60 * 1000;

/** ISO-weekdag (1 = maandag) van een lokale datum "YYYY-MM-DD". */
export function weekdayOf(date: string): Weekday {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/**
 * Openingstijden op één datum: een afwijking voor die datum gaat voor de
 * vaste week. "Gesloten" wint van afwijkende tijden.
 */
export function openingRangesFor(
  date: string,
  weekly: WeeklyHours,
  exceptions: DateException[],
): OpeningRange[] {
  const exception = exceptions.find((item) => item.date === date);
  if (exception) return exception.closed ? [] : exception.ranges;
  return weekly[weekdayOf(date)];
}

/** Eerste en laatste datum waarop je kunt aanvragen. */
export function bookingWindow(now: Date, rules: SlotRules): { firstDate: string; lastDate: string } {
  const earliest = new Date(now.getTime() + rules.minLeadTimeHours * 60 * minute);
  return {
    firstDate: localDateString(earliest),
    lastDate: addDays(localDateString(now), rules.maxAdvanceWeeks * 7),
  };
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Alle vrije begintijden op een datum voor een behandeling van `durationMinutes`. */
export function slotsForDate(input: {
  date: string;
  durationMinutes: number;
  ranges: OpeningRange[];
  busy: Interval[];
  now: Date;
  rules: SlotRules;
}): Interval[] {
  const { date, durationMinutes, ranges, busy, now, rules } = input;
  const window = bookingWindow(now, rules);
  if (date < window.firstDate || date > window.lastDate) return [];

  const earliestStart = new Date(now.getTime() + rules.minLeadTimeHours * 60 * minute);
  const length = durationMinutes * minute;
  const step = rules.slotIntervalMinutes * minute;
  const slots: Interval[] = [];

  for (const range of ranges) {
    const open = zonedDateTimeToUtc(date, range.opensAt).getTime();
    const close = zonedDateTimeToUtc(date, range.closesAt).getTime();
    for (let start = open; start < close; start += step) {
      const end = start + length;
      if (rules.mustFinishBeforeClosing && end > close) break;
      const slot = { start: new Date(start), end: new Date(end) };
      if (slot.start < earliestStart) continue;
      if (busy.some((interval) => overlaps(slot, interval))) continue;
      slots.push(slot);
    }
  }
  return slots;
}

/** Ligt een gekozen begintijd precies op een vrij tijdslot? (controle bij opslaan) */
export function isSlotAvailable(
  start: Date,
  input: Parameters<typeof slotsForDate>[0],
): boolean {
  return slotsForDate(input).some((slot) => slot.start.getTime() === start.getTime());
}
