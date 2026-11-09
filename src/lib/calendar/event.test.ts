import assert from "node:assert/strict";
import { test } from "node:test";
import { appointmentEvent, eventTimes, eventUid, sameTimes } from "./event";

const startAt = new Date("2026-11-20T09:30:00Z");
const endAt = new Date("2026-11-20T10:45:00Z");

test("een afspraak wordt een agenda-item en geeft dezelfde tijden terug", () => {
  const text = appointmentEvent({
    appointmentId: "abc",
    startAt,
    endAt,
    title: "BIAB, naturel – Sanne de Vries",
    description: "Afspraak via NovaLuxe; wijzig hem in het beheer.",
  });
  assert.match(text, new RegExp(`UID:${eventUid("abc")}\\r\\n`));
  assert.match(text, /DTSTART:20261120T093000Z/);
  // Komma's en puntkomma's worden ge-escaped.
  assert.match(text, /SUMMARY:BIAB\\, naturel – Sanne de Vries/);
  assert.match(text, /NovaLuxe\\; wijzig/);
  const times = eventTimes(text);
  assert.ok(times && sameTimes(times, { startAt, endAt }));
});

test("lange regels worden gevouwen en blijven leesbaar", () => {
  const long = "Manicure – met gellak ".repeat(12);
  const text = appointmentEvent({ appointmentId: "lang", startAt, endAt, title: long, description: long });
  for (const line of text.split("\r\n")) assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(eventTimes(text));
  // Na ontvouwen staat de titel er weer heel.
  assert.ok(text.replace(/\r\n /g, "").includes(`SUMMARY:${long}`));
});

test("een op de iPhone verschoven item in een andere tijdzone wordt goed gelezen", () => {
  const moved = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Amsterdam",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    "UID:novaluxe-abc",
    "DTSTART;TZID=Europe/Amsterdam:20261120T140000",
    "DTEND;TZID=Europe/Amsterdam:20261120T151500",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const times = eventTimes(moved);
  assert.equal(times?.startAt.toISOString(), "2026-11-20T13:00:00.000Z");
  assert.equal(times?.endAt.toISOString(), "2026-11-20T14:15:00.000Z");
});
