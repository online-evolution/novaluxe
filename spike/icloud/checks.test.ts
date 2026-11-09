import assert from "node:assert/strict";
import { test } from "node:test";
import { busyIntervals } from "../../src/lib/calendar/busy";

test("de eigen testafspraken van de spike geven precies de verwachte bezette tijden", async () => {
  const { testObjects } = await import("./checks");
  const plan = testObjects("2027-03-20");
  // Ook over de overgang naar zomertijd (28 maart 2027) heen.
  const { intervals } = busyIntervals(
    plan.objects.map((object) => object.text),
    new Date("2027-03-19T00:00:00Z"),
    new Date("2027-04-30T00:00:00Z"),
  );
  const timed = intervals
    .filter((item) => !item.allDay)
    .map((item) => `${item.start.toISOString()}/${item.end.toISOString()}`)
    .sort();
  assert.deepEqual(timed, plan.expectedTimed);
  assert.equal(intervals.filter((item) => item.allDay).length, 1);
});
