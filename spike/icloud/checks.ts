import { randomUUID } from "node:crypto";
import { DAVClient, type DAVCalendar, type DAVCalendarObject } from "tsdav";
import { addDays, localDateString, zonedDateTimeToUtc } from "../../src/lib/time";
import { busyIntervals } from "../../src/lib/calendar/busy";

/*
 * iCloud-spike (Fase 14): alle controles in één functie, voor het script
 * (run.ts) en de testpagina in het beheer. Er wordt niets opgeslagen.
 *
 * De spike maakt zijn eigen testafspraken in de agenda "NovaLuxe spike" (een
 * losse afspraak, een wekelijkse herhaling met een verplaatste en een
 * geschrapte keer, een afspraak op "vrij" en een hele dag), leest ze terug
 * en vergelijkt de bezette tijden met wat er verwacht wordt. Daarna test hij
 * wijzigen met de juiste en met een verouderde ETag, en ruimt alles op.
 * Uit de andere agenda's leest hij alleen hoeveel er bezet is.
 */

export type SpikeStep = {
  label: string;
  /** `null`: alleen ter informatie, telt niet mee voor het oordeel. */
  ok: boolean | null;
  detail: string;
  ms: number;
};

export type SpikeReport = { ok: boolean; steps: SpikeStep[] };

const serverUrl = "https://caldav.icloud.com";
const spikeCalendarName = "NovaLuxe spike";

const amsterdamZone = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Amsterdam",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

const stamp = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const local = (date: string, time: string) => `${date.replace(/-/g, "")}T${time.replace(":", "")}00`;
const calendarText = (events: string[][]) =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NovaLuxe//iCloud-spike//NL",
    ...amsterdamZone,
    ...events.flatMap((lines) => ["BEGIN:VEVENT", ...lines, `DTSTAMP:${stamp()}`, "END:VEVENT"]),
    "END:VCALENDAR",
    "",
  ].join("\r\n");

type TestObject = { uid: string; text: string };

/** De testafspraken, met de bezette tijden die we daarna terug moeten zien. */
export function testObjects(baseDate: string) {
  const day = (offset: number) => addDays(baseDate, offset);
  const single = { uid: `novaluxe-spike-${randomUUID()}`, date: day(0) };
  const weekly = { uid: `novaluxe-spike-${randomUUID()}`, date: day(1) };
  const free = { uid: `novaluxe-spike-${randomUUID()}`, date: day(2) };
  const allDay = { uid: `novaluxe-spike-${randomUUID()}`, date: day(3) };

  const objects: TestObject[] = [
    {
      uid: single.uid,
      text: calendarText([
        [
          `UID:${single.uid}`,
          `DTSTART;TZID=Europe/Amsterdam:${local(single.date, "10:00")}`,
          `DTEND;TZID=Europe/Amsterdam:${local(single.date, "11:00")}`,
          "SUMMARY:NovaLuxe spike: losse afspraak",
        ],
      ]),
    },
    {
      uid: weekly.uid,
      text: calendarText([
        [
          `UID:${weekly.uid}`,
          `DTSTART;TZID=Europe/Amsterdam:${local(weekly.date, "19:00")}`,
          `DTEND;TZID=Europe/Amsterdam:${local(weekly.date, "20:00")}`,
          "RRULE:FREQ=WEEKLY;COUNT=4",
          `EXDATE;TZID=Europe/Amsterdam:${local(addDays(weekly.date, 14), "19:00")}`,
          "SUMMARY:NovaLuxe spike: wekelijks",
        ],
        [
          `UID:${weekly.uid}`,
          `RECURRENCE-ID;TZID=Europe/Amsterdam:${local(addDays(weekly.date, 7), "19:00")}`,
          `DTSTART;TZID=Europe/Amsterdam:${local(addDays(weekly.date, 7), "21:00")}`,
          `DTEND;TZID=Europe/Amsterdam:${local(addDays(weekly.date, 7), "22:00")}`,
          "SUMMARY:NovaLuxe spike: wekelijks (verplaatst)",
        ],
      ]),
    },
    {
      uid: free.uid,
      text: calendarText([
        [
          `UID:${free.uid}`,
          `DTSTART;TZID=Europe/Amsterdam:${local(free.date, "09:00")}`,
          `DTEND;TZID=Europe/Amsterdam:${local(free.date, "10:00")}`,
          "TRANSP:TRANSPARENT",
          "SUMMARY:NovaLuxe spike: vrij",
        ],
      ]),
    },
    {
      uid: allDay.uid,
      text: calendarText([
        [
          `UID:${allDay.uid}`,
          `DTSTART;VALUE=DATE:${allDay.date.replace(/-/g, "")}`,
          `DTEND;VALUE=DATE:${addDays(allDay.date, 1).replace(/-/g, "")}`,
          "SUMMARY:NovaLuxe spike: hele dag",
        ],
      ]),
    },
  ];

  const at = (date: string, time: string) => zonedDateTimeToUtc(date, time).toISOString();
  const expectedTimed = [
    `${at(single.date, "10:00")}/${at(single.date, "11:00")}`,
    `${at(weekly.date, "19:00")}/${at(weekly.date, "20:00")}`,
    `${at(addDays(weekly.date, 7), "21:00")}/${at(addDays(weekly.date, 7), "22:00")}`,
    `${at(addDays(weekly.date, 21), "19:00")}/${at(addDays(weekly.date, 21), "20:00")}`,
  ].sort();

  return { objects, single, expectedTimed, lastDate: addDays(baseDate, 30) };
}

const nameOf = (calendar: DAVCalendar) =>
  typeof calendar.displayName === "string" ? calendar.displayName : "(zonder naam)";

const isEventCalendar = (calendar: DAVCalendar) =>
  !calendar.components || calendar.components.length === 0 || calendar.components.includes("VEVENT");

export async function runIcloudSpike(input: {
  username: string;
  password: string;
  /** Alleen lezen: geen testagenda en geen testafspraken. */
  readOnly?: boolean;
}): Promise<SpikeReport> {
  const steps: SpikeStep[] = [];
  const redact = (text: string) => {
    let safe = text;
    for (const secret of [input.password, input.username, encodeURIComponent(input.username)]) {
      if (secret) safe = safe.split(secret).join("[verborgen]");
    }
    return safe;
  };
  const describe = (error: unknown) => redact(error instanceof Error ? error.message : String(error));

  async function step<T>(label: string, run: () => Promise<{ value: T; detail?: string; ok?: boolean | null }>) {
    const started = performance.now();
    try {
      const { value, detail = "", ok = true } = await run();
      steps.push({ label, ok, detail: redact(detail), ms: Math.round(performance.now() - started) });
      return value;
    } catch (error) {
      steps.push({ label, ok: false, detail: describe(error), ms: Math.round(performance.now() - started) });
      throw error;
    }
  }

  const finish = (): SpikeReport => ({ ok: steps.every((item) => item.ok !== false), steps });

  const client = new DAVClient({
    serverUrl,
    credentials: { username: input.username, password: input.password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });

  try {
    await step("Inloggen bij iCloud", async () => {
      await client.login();
      return { value: null };
    });

    let calendars = await step("Agenda's vinden", async () => {
      const all = (await client.fetchCalendars()).filter(isEventCalendar);
      const withToken = all.filter((calendar) => calendar.ctag || calendar.syncToken).length;
      return {
        value: all,
        detail: `${all.length} agenda's (${all.map(nameOf).join(", ")}); ${withToken} met een wijzigingskenmerk`,
      };
    });

    // Bezet uit de eigen agenda's: alleen aantallen, nooit inhoud.
    const from = new Date();
    const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    await step("Bezette tijden lezen (komende 30 dagen)", async () => {
      const texts: string[] = [];
      for (const calendar of calendars.filter((item) => nameOf(item) !== spikeCalendarName)) {
        const objects = await client.fetchCalendarObjects({
          calendar,
          timeRange: { start: from.toISOString(), end: to.toISOString() },
        });
        texts.push(...objects.map((object) => String(object.data ?? "")).filter(Boolean));
      }
      const { intervals } = busyIntervals(texts, from, to);
      return {
        value: null,
        detail: `${intervals.length} bezette tijdvakken gevonden; alleen begin, einde en bezet/vrij gelezen`,
      };
    });

    if (input.readOnly) return finish();

    // Eigen testagenda.
    let spike = calendars.find((calendar) => nameOf(calendar) === spikeCalendarName);
    if (!spike) {
      await step(`Testagenda "${spikeCalendarName}" aanmaken`, async () => {
        const homeUrl = client.account?.homeUrl;
        if (!homeUrl) throw new Error("Geen agendamap gevonden.");
        const responses = await client.makeCalendar({
          url: new URL(`novaluxe-spike-${randomUUID()}/`, homeUrl).href,
          props: {
            displayname: spikeCalendarName,
            "c:supported-calendar-component-set": { "c:comp": { _attributes: { name: "VEVENT" } } },
          },
        });
        const failed = responses.find((response) => !response.ok);
        if (failed) throw new Error(`status ${failed.status}`);
        return { value: null };
      });
      calendars = (await client.fetchCalendars()).filter(isEventCalendar);
      spike = calendars.find((calendar) => nameOf(calendar) === spikeCalendarName);
      if (!spike) throw new Error("De testagenda is aangemaakt maar niet teruggevonden.");
    }
    const testCalendar: DAVCalendar = spike;
    const before = { ctag: testCalendar.ctag, syncToken: testCalendar.syncToken };

    const baseDate = addDays(localDateString(), 3);
    const plan = testObjects(baseDate);
    const urlOf = (uid: string) => new URL(`${uid}.ics`, testCalendar.url).href;
    const created: string[] = [];

    try {
      await step("Testafspraken maken", async () => {
        for (const object of plan.objects) {
          const response = await client.createCalendarObject({
            calendar: testCalendar,
            filename: `${object.uid}.ics`,
            iCalString: object.text,
          });
          if (!response.ok) throw new Error(`status ${response.status}`);
          created.push(object.uid);
        }
        return { value: null, detail: "losse afspraak, wekelijkse herhaling (één keer verplaatst, één keer geschrapt), op vrij, hele dag" };
      });

      await step("Testafspraken teruglezen en controleren", async () => {
        const windowStart = zonedDateTimeToUtc(baseDate, "00:00");
        const windowEnd = zonedDateTimeToUtc(plan.lastDate, "00:00");
        const objects = await client.fetchCalendarObjects({
          calendar: testCalendar,
          timeRange: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
        });
        const ours = objects.filter((object) => created.some((uid) => object.url.includes(uid)));
        const { intervals, stats } = busyIntervals(ours.map((object) => String(object.data ?? "")), windowStart, windowEnd);
        const timed = intervals.filter((item) => !item.allDay).map((item) => `${item.start.toISOString()}/${item.end.toISOString()}`).sort();
        const allDay = intervals.filter((item) => item.allDay).length;
        const matches =
          timed.length === plan.expectedTimed.length && timed.every((value, index) => value === plan.expectedTimed[index]) && allDay === 1;
        return {
          value: null,
          ok: matches,
          detail: matches
            ? `klopt: 4 bezette tijden, 1 hele dag; de afspraak op vrij telt niet mee (${ours.length} objecten, ${stats.exceptions} uitzondering)`
            : `klopt niet: verwacht ${plan.expectedTimed.length} tijden en 1 hele dag, gevonden ${timed.length} tijden en ${allDay} hele dag(en)`,
        };
      });

      const single = plan.objects[0]!;

      const first = await step("Versiekenmerk (ETag) ophalen", async () => {
        const object = await fetchOne(single.uid);
        if (!object?.etag) throw new Error("geen ETag teruggekregen");
        return { value: object };
      });

      // Een half uur later; alleen de begin- en eindregel veranderen.
      const moved = single.text
        .replace(/(DTSTART;TZID=Europe\/Amsterdam:\d{8})T100000/, "$1T103000")
        .replace(/(DTEND;TZID=Europe\/Amsterdam:\d{8})T110000/, "$1T113000");
      await step("Wijzigen met het juiste versiekenmerk", async () => {
        const response = await client.updateCalendarObject({ calendarObject: { url: first.url, data: moved, etag: first.etag } });
        if (!response.ok) throw new Error(`status ${response.status}`);
        return { value: null };
      });

      await step("Wijzigen met een verouderd versiekenmerk wordt geweigerd", async () => {
        const response = await client.updateCalendarObject({ calendarObject: { url: first.url, data: single.text, etag: first.etag } });
        return {
          value: null,
          ok: response.status === 412,
          detail:
            response.status === 412
              ? "iCloud weigert (412): een wijziging op de iPhone wordt nooit stil overschreven"
              : `verwacht 412, kreeg ${response.status}`,
        };
      });

      await step("Wijziging opmerken", async () => {
        const current = await fetchOne(single.uid);
        const after = (await client.fetchCalendars()).find((calendar) => calendar.url === testCalendar.url);
        const etagChanged = Boolean(current?.etag && current.etag !== first.etag);
        const calendarChanged = Boolean(
          (after?.ctag && after.ctag !== before.ctag) || (after?.syncToken && after.syncToken !== before.syncToken),
        );
        return {
          value: null,
          ok: etagChanged && calendarChanged,
          detail: `versiekenmerk afspraak veranderd: ${etagChanged ? "ja" : "nee"}; kenmerk agenda veranderd: ${calendarChanged ? "ja" : "nee"}`,
        };
      });
    } finally {
      await step("Testafspraken opruimen", async () => {
        let removed = 0;
        for (const uid of [...created]) {
          const object = await fetchOne(uid).catch(() => undefined);
          const response = await client.deleteCalendarObject({ calendarObject: { url: urlOf(uid), etag: object?.etag } });
          if (response.ok || response.status === 404) {
            removed++;
            created.splice(created.indexOf(uid), 1);
          }
        }
        return { value: null, ok: created.length === 0, detail: `${removed} verwijderd; de agenda "${spikeCalendarName}" blijft leeg staan` };
      }).catch(() => undefined);
    }

    async function fetchOne(uid: string): Promise<DAVCalendarObject | undefined> {
      return (await client.fetchCalendarObjects({ calendar: testCalendar, objectUrls: [urlOf(uid)] }))[0];
    }
  } catch {
    // De mislukte stap staat al in het rapport.
  }

  return finish();
}
