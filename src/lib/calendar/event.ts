import ICAL from "ical.js";

/*
 * Agenda-items voor NovaLuxe-afspraken in de agenda "NovaLuxe" van Jessie,
 * en het teruglezen van begin en einde (om een verschuiving op de iPhone op
 * te merken). Tijden altijd in UTC; de iPhone toont ze in de eigen tijdzone.
 */

const icsTime = (at: Date) => at.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Tekst volgens RFC 5545: komma's, puntkomma's, backslashes en regeleinden escapen. */
const escapeText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Regels vouwen op 75 bytes (UTF-8), zoals de standaard vraagt, zonder een teken door te knippen. */
function fold(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (bytes + size > 75) {
      parts.push(current);
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n");
}

export const eventUid = (appointmentId: string) => `novaluxe-${appointmentId}`;

export function appointmentEvent(input: {
  appointmentId: string;
  startAt: Date;
  endAt: Date;
  title: string;
  description: string;
}): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NovaLuxe//Afspraken//NL",
    "BEGIN:VEVENT",
    `UID:${eventUid(input.appointmentId)}`,
    `DTSTAMP:${icsTime(new Date())}`,
    `DTSTART:${icsTime(input.startAt)}`,
    `DTEND:${icsTime(input.endAt)}`,
    fold(`SUMMARY:${escapeText(input.title)}`),
    fold(`DESCRIPTION:${escapeText(input.description)}`),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Begin en einde van het (eerste, niet-herhaalde) agenda-item, of `null` als dat er niet is. */
export function eventTimes(icsText: string): { startAt: Date; endAt: Date } | null {
  const calendar = new ICAL.Component(ICAL.parse(icsText));
  for (const zone of calendar.getAllSubcomponents("vtimezone")) ICAL.TimezoneService.register(zone);
  const vevent = calendar.getAllSubcomponents("vevent").find((item) => !item.hasProperty("recurrence-id"));
  if (!vevent) return null;
  const event = new ICAL.Event(vevent);
  return { startAt: event.startDate.toJSDate(), endAt: event.endDate.toJSDate() };
}

export const sameTimes = (
  a: { startAt: Date; endAt: Date },
  b: { startAt: Date; endAt: Date },
) => a.startAt.getTime() === b.startAt.getTime() && a.endAt.getTime() === b.endAt.getTime();
