import { site } from "@/config/site";

const isoDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: site.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Datum (YYYY-MM-DD) zoals die nu in Nederland is, ongeacht de servertijdzone. */
export function localDateString(at: Date = new Date()): string {
  return isoDate.format(at);
}

/** Telt dagen op bij een lokale datum (YYYY-MM-DD) zonder tijdzoneverschuiving. */
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

const zoneParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: site.timeZone,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Verschil (ms) tussen Nederlandse kloktijd en UTC op een bepaald moment. */
function zoneOffset(at: Date): number {
  const parts = Object.fromEntries(
    zoneParts.formatToParts(at).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - at.getTime();
}

/**
 * Nederlandse kloktijd ("2026-10-25", "09:30") → exact UTC-moment, met zomer-
 * en wintertijd. Bij de klok-vooruit-overgang (02:00–03:00 bestaat niet) wordt
 * naar het eerstvolgende bestaande moment geschoven; bij klok-terug (02:00–03:00
 * komt twee keer voor) wordt het eerste moment gekozen.
 */
export function zonedDateTimeToUtc(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const [hour, minute] = time.split(":").map(Number) as [number, number];
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  const sixHours = 6 * 60 * 60 * 1000;

  // De offsets rond dit moment: één, of twee rond een zomer-/wintertijdovergang.
  const offsets = [
    ...new Set([zoneOffset(new Date(naive - sixHours)), zoneOffset(new Date(naive + sixHours))]),
  ];
  const matches = offsets
    .map((offset) => naive - offset)
    .filter((candidate) => {
      const local = utcToZonedParts(new Date(candidate));
      return local.date === date && local.time === time;
    });

  // Klok terug: de tijd bestaat twee keer, neem de eerste.
  if (matches.length > 0) return new Date(Math.min(...matches));
  // Klok vooruit: de tijd bestaat niet, schuif op naar het eerstvolgende moment.
  return new Date(naive - Math.min(...offsets));
}

/** UTC-moment → Nederlandse datum en tijd ("2026-10-25", "09:30"). */
export function utcToZonedParts(at: Date): { date: string; time: string } {
  const parts = Object.fromEntries(
    zoneParts.formatToParts(at).map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

const longDate = new Intl.DateTimeFormat(site.locale, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "maandag 12 oktober" voor een lokale datum (YYYY-MM-DD). */
export function formatLongDate(date: string): string {
  return longDate.format(new Date(`${date}T00:00:00Z`));
}
