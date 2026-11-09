import assert from "node:assert/strict";
import { test } from "node:test";
import { busyIntervals } from "./busy";

const amsterdam = `BEGIN:VTIMEZONE
TZID:Europe/Amsterdam
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

const calendar = (...events: string[]) =>
  ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//test//NL", amsterdam, ...events, "END:VCALENDAR"].join("\r\n");

const from = new Date("2026-11-09T00:00:00Z");
const to = new Date("2026-12-07T00:00:00Z");

test("losse afspraak in Nederlandse tijd wordt UTC", () => {
  const ics = calendar(`BEGIN:VEVENT
UID:een
DTSTART;TZID=Europe/Amsterdam:20261110T100000
DTEND;TZID=Europe/Amsterdam:20261110T113000
SUMMARY:Privé
END:VEVENT`);
  const { intervals } = busyIntervals([ics], from, to);
  assert.equal(intervals.length, 1);
  assert.equal(intervals[0]!.start.toISOString(), "2026-11-10T09:00:00.000Z");
  assert.equal(intervals[0]!.end.toISOString(), "2026-11-10T10:30:00.000Z");
});

test("wekelijkse herhaling met een verplaatste en een geschrapte keer", () => {
  const ics = calendar(
    `BEGIN:VEVENT
UID:sport
DTSTART;TZID=Europe/Amsterdam:20261111T190000
DTEND;TZID=Europe/Amsterdam:20261111T200000
RRULE:FREQ=WEEKLY;COUNT=4
EXDATE;TZID=Europe/Amsterdam:20261125T190000
END:VEVENT`,
    `BEGIN:VEVENT
UID:sport
RECURRENCE-ID;TZID=Europe/Amsterdam:20261118T190000
DTSTART;TZID=Europe/Amsterdam:20261118T210000
DTEND;TZID=Europe/Amsterdam:20261118T220000
END:VEVENT`,
  );
  const { intervals, stats } = busyIntervals([ics], from, to);
  assert.deepEqual(
    intervals.map((item) => item.start.toISOString()),
    ["2026-11-11T18:00:00.000Z", "2026-11-18T20:00:00.000Z", "2026-12-02T18:00:00.000Z"],
  );
  assert.equal(stats.recurring, 1);
  assert.equal(stats.exceptions, 1);
});

test("vrij, geannuleerd en hele dag", () => {
  const ics = calendar(
    `BEGIN:VEVENT
UID:vrij
DTSTART:20261112T090000Z
DTEND:20261112T100000Z
TRANSP:TRANSPARENT
END:VEVENT`,
    `BEGIN:VEVENT
UID:weg
DTSTART:20261113T090000Z
DTEND:20261113T100000Z
STATUS:CANCELLED
END:VEVENT`,
    `BEGIN:VEVENT
UID:dag
DTSTART;VALUE=DATE:20261114
DTEND;VALUE=DATE:20261115
END:VEVENT`,
  );
  const { intervals, stats } = busyIntervals([ics], from, to);
  assert.equal(intervals.length, 1);
  assert.equal(intervals[0]!.allDay, true);
  assert.deepEqual(
    { transparent: stats.transparent, cancelled: stats.cancelled, allDay: stats.allDay },
    { transparent: 1, cancelled: 1, allDay: 1 },
  );
});

test("afspraken buiten het venster tellen niet mee", () => {
  const ics = calendar(`BEGIN:VEVENT
UID:later
DTSTART:20270110T090000Z
DTEND:20270110T100000Z
END:VEVENT`);
  assert.equal(busyIntervals([ics], from, to).intervals.length, 0);
});
