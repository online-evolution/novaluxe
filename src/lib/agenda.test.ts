import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { busyTitle, formatDuration, minutesBetween } from "./agenda";

describe("formatDuration", () => {
  it("toont minuten, hele uren en een mengvorm", () => {
    assert.equal(formatDuration(45), "45 min");
    assert.equal(formatDuration(60), "1 uur");
    assert.equal(formatDuration(75), "1 uur 15 min");
    assert.equal(formatDuration(240), "4 uur");
  });
});

describe("minutesBetween", () => {
  it("rekent het verschil in minuten", () => {
    assert.equal(minutesBetween(new Date("2026-11-12T10:00:00Z"), new Date("2026-11-12T11:15:00Z")), 75);
  });
});

describe("busyTitle", () => {
  it("haalt een tijd vooraan weg", () => {
    assert.equal(busyTitle("11.00 Eveline"), "Eveline");
    assert.equal(busyTitle("1230 Jaimy"), "Jaimy");
    assert.equal(busyTitle("9.00 Shirley omhoog plaatsen"), "Shirley omhoog plaatsen");
    assert.equal(busyTitle("13:00 matten eruit + knippen"), "matten eruit + knippen");
    assert.equal(busyTitle("930 Kim"), "Kim");
    assert.equal(busyTitle("10 uur Sanne"), "10 uur Sanne");
    assert.equal(busyTitle("14.30u - Lisa"), "Lisa");
  });

  it("laat andere getallen staan", () => {
    assert.equal(busyTitle("2 banen omhoog"), "2 banen omhoog");
    assert.equal(busyTitle("10 nagels"), "10 nagels");
    assert.equal(busyTitle("Tandarts"), "Tandarts");
  });

  it("houdt de titel als er alleen een tijd staat", () => {
    assert.equal(busyTitle("11.00"), "11.00");
    assert.equal(busyTitle(null), null);
    assert.equal(busyTitle(""), null);
  });
});
