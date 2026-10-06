import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDays, utcToZonedParts, zonedDateTimeToUtc } from "./time";

describe("zonedDateTimeToUtc", () => {
  it("wintertijd: Nederland is UTC+1", () => {
    assert.equal(zonedDateTimeToUtc("2026-01-15", "09:00").toISOString(), "2026-01-15T08:00:00.000Z");
  });

  it("zomertijd: Nederland is UTC+2", () => {
    assert.equal(zonedDateTimeToUtc("2026-07-01", "09:00").toISOString(), "2026-07-01T07:00:00.000Z");
  });

  it("dag van de klok vooruit (29 maart 2026): ochtend en avond kloppen", () => {
    assert.equal(zonedDateTimeToUtc("2026-03-29", "01:30").toISOString(), "2026-03-29T00:30:00.000Z");
    assert.equal(zonedDateTimeToUtc("2026-03-29", "09:00").toISOString(), "2026-03-29T07:00:00.000Z");
  });

  it("niet-bestaande tijd (02:30 op 29 maart) schuift door naar 03:30", () => {
    const result = zonedDateTimeToUtc("2026-03-29", "02:30");
    assert.equal(result.toISOString(), "2026-03-29T01:30:00.000Z");
    assert.deepEqual(utcToZonedParts(result), { date: "2026-03-29", time: "03:30" });
  });

  it("dubbele tijd (02:30 op 25 oktober) kiest de eerste keer", () => {
    assert.equal(zonedDateTimeToUtc("2026-10-25", "02:30").toISOString(), "2026-10-25T00:30:00.000Z");
  });

  it("dag van de klok terug (25 oktober 2026): 09:00 is UTC+1", () => {
    assert.equal(zonedDateTimeToUtc("2026-10-25", "09:00").toISOString(), "2026-10-25T08:00:00.000Z");
  });

  it("heen en terug levert dezelfde kloktijd op", () => {
    for (const [date, time] of [
      ["2026-02-03", "13:15"],
      ["2026-06-30", "20:00"],
      ["2026-10-24", "18:45"],
      ["2026-12-31", "23:59"],
    ] as const) {
      assert.deepEqual(utcToZonedParts(zonedDateTimeToUtc(date, time)), { date, time });
    }
  });
});

describe("addDays", () => {
  it("telt over maand- en jaargrenzen", () => {
    assert.equal(addDays("2026-10-31", 1), "2026-11-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-28", 2), "2026-03-30");
  });
});
