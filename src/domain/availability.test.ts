import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { zonedDateTimeToUtc } from "@/lib/time";
import {
  bookingWindow,
  isSlotAvailable,
  openingRangesFor,
  slotsForDate,
  weekdayOf,
  type SlotRules,
} from "./availability";
import type { WeeklyHours } from "./hours";

const rules: SlotRules = {
  slotIntervalMinutes: 15,
  minLeadTimeHours: 12,
  maxAdvanceWeeks: 8,
  mustFinishBeforeClosing: true,
};

const week: WeeklyHours = {
  1: [{ opensAt: "09:00", closesAt: "18:00" }],
  2: [{ opensAt: "09:00", closesAt: "18:00" }],
  3: [{ opensAt: "09:00", closesAt: "18:00" }],
  4: [{ opensAt: "09:00", closesAt: "20:00" }],
  5: [{ opensAt: "09:00", closesAt: "18:00" }],
  6: [{ opensAt: "09:00", closesAt: "14:00" }],
  7: [],
};

// "Nu" = maandag 2 november 2026, 08:00 Nederlandse tijd.
const now = zonedDateTimeToUtc("2026-11-02", "08:00");
const at = (date: string, time: string) => zonedDateTimeToUtc(date, time);
const labels = (slots: { start: Date }[]) =>
  slots.map((slot) =>
    new Intl.DateTimeFormat("nl-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit" }).format(slot.start),
  );

describe("weekdayOf en openingRangesFor", () => {
  it("rekent ISO-weekdagen (maandag = 1, zondag = 7)", () => {
    assert.equal(weekdayOf("2026-11-02"), 1);
    assert.equal(weekdayOf("2026-11-08"), 7);
  });

  it("een afwijkende dag gaat voor de vaste week", () => {
    const exceptions = [
      { date: "2026-11-03", closed: true, ranges: [] },
      { date: "2026-11-08", closed: false, ranges: [{ opensAt: "10:00", closesAt: "12:00" }] },
    ];
    assert.deepEqual(openingRangesFor("2026-11-03", week, exceptions), []);
    assert.deepEqual(openingRangesFor("2026-11-08", week, exceptions), [{ opensAt: "10:00", closesAt: "12:00" }]);
    assert.deepEqual(openingRangesFor("2026-11-04", week, exceptions), week[3]);
  });
});

describe("slotsForDate", () => {
  it("geeft tijden per 15 minuten, behandeling klaar vóór sluitingstijd", () => {
    const slots = slotsForDate({ date: "2026-11-07", durationMinutes: 60, ranges: week[6], busy: [], now, rules });
    const times = labels(slots);
    assert.equal(times[0], "09:00");
    assert.equal(times[1], "09:15");
    assert.equal(times.at(-1), "13:00");
    assert.equal(slots.length, 17);
  });

  it("respecteert de minimale aanvraagtijd (12 uur)", () => {
    // Nu maandag 08:00: maandag zelf vóór 20:00 kan niet; maandag sluit om 18:00.
    assert.equal(slotsForDate({ date: "2026-11-02", durationMinutes: 30, ranges: week[1], busy: [], now, rules }).length, 0);
    const tuesday = slotsForDate({ date: "2026-11-03", durationMinutes: 30, ranges: week[2], busy: [], now, rules });
    assert.equal(labels(tuesday)[0], "09:00");
  });

  it("niet verder vooruit dan 8 weken", () => {
    assert.ok(slotsForDate({ date: "2026-12-28", durationMinutes: 30, ranges: week[1], busy: [], now, rules }).length > 0);
    assert.equal(slotsForDate({ date: "2027-01-04", durationMinutes: 30, ranges: week[1], busy: [], now, rules }).length, 0);
  });

  it("slaat bezette tijden over, aansluitend mag", () => {
    const busy = [{ start: at("2026-11-04", "10:00"), end: at("2026-11-04", "11:00") }];
    const times = labels(slotsForDate({ date: "2026-11-04", durationMinutes: 45, ranges: week[3], busy, now, rules }));
    assert.ok(times.includes("09:15"), "09:15–10:00 sluit precies aan");
    assert.ok(!times.includes("09:30"), "09:30–10:15 overlapt");
    assert.ok(!times.includes("10:45"), "10:45 valt in de bezette tijd");
    assert.ok(times.includes("11:00"));
  });

  it("een pauze splitst de dag; een behandeling loopt niet door de pauze", () => {
    const ranges = [
      { opensAt: "09:00", closesAt: "12:00" },
      { opensAt: "13:00", closesAt: "18:00" },
    ];
    const times = labels(slotsForDate({ date: "2026-11-04", durationMinutes: 60, ranges, busy: [], now, rules }));
    assert.ok(times.includes("11:00"));
    assert.ok(!times.includes("11:15"));
    assert.ok(!times.includes("12:30"));
    assert.ok(times.includes("13:00"));
  });

  it("zonder 'klaar vóór sluitingstijd' mag de laatste begintijd vlak voor sluiten liggen", () => {
    const times = labels(
      slotsForDate({ date: "2026-11-07", durationMinutes: 60, ranges: week[6], busy: [], now, rules: { ...rules, mustFinishBeforeClosing: false } }),
    );
    assert.equal(times.at(-1), "13:45");
  });

  it("werkt op de dag van de klok-terug-overgang (25 oktober 2026, zondag open als afwijking)", () => {
    const earlyNow = zonedDateTimeToUtc("2026-10-20", "08:00");
    const slots = slotsForDate({
      date: "2026-10-25",
      durationMinutes: 60,
      ranges: [{ opensAt: "09:00", closesAt: "12:00" }],
      busy: [],
      now: earlyNow,
      rules,
    });
    assert.equal(slots[0]?.start.toISOString(), "2026-10-25T08:00:00.000Z");
    assert.deepEqual(labels(slots).slice(0, 2), ["09:00", "09:15"]);
  });

  it("isSlotAvailable keurt alleen een tijd goed die echt vrij is", () => {
    const input = { date: "2026-11-04", durationMinutes: 30, ranges: week[3], busy: [], now, rules };
    assert.equal(isSlotAvailable(at("2026-11-04", "09:15"), input), true);
    assert.equal(isSlotAvailable(at("2026-11-04", "09:10"), input), false);
    assert.equal(isSlotAvailable(at("2026-11-04", "17:45"), input), false);
  });
});

describe("bookingWindow", () => {
  it("eerste datum volgt de minimale aanvraagtijd, laatste de weken vooruit", () => {
    assert.deepEqual(bookingWindow(zonedDateTimeToUtc("2026-11-02", "20:00"), rules), {
      firstDate: "2026-11-03",
      lastDate: "2026-12-28",
    });
  });
});
