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
