/*
 * iCloud-spike (Fase 14). Losstaand script, geen onderdeel van de app.
 *
 *   npm run spike:icloud                      lezen + schrijven in een testagenda
 *   npm run spike:icloud -- --alleen-lezen    alleen lezen (begin, einde, bezet)
 *   npm run spike:icloud -- --rapport <bestand>
 *
 * Inloggegevens alleen in .env.icloud-spike (valt onder .env* in .gitignore):
 *   ICLOUD_SPIKE_USERNAME=<Apple ID van het testaccount>
 *   ICLOUD_SPIKE_APP_PASSWORD=<app-specifiek wachtwoord>
 *   ICLOUD_SPIKE_BEVESTIG=testaccount
 *
 * Wat de spike vastlegt (zie docs/icloud-spike.md):
 *   1. inloggen bij caldav.icloud.com met een app-specifiek wachtwoord;
 *   2. agenda's vinden;
 *   3. lezen: alleen begin, einde en bezet/vrij over de komende 30 dagen,
 *      met eigen uitrol van herhalingen; of de server zelf kan uitrollen
 *      (expand) en een free-busy-query ondersteunt;
 *   4. schrijven, alleen in de agenda "NovaLuxe spike": aanmaken, wijzigen met
 *      If-Match, een wijziging met een verouderde ETag (moet 412 geven: niets
 *      wordt stil overschreven), verwijderen;
 *   5. of de agenda een ctag/sync-token heeft die verandert (basis voor het
 *      opmerken van wijzigingen op de iPhone).
 *
 * Er wordt nooit een titel, beschrijving of locatie van een bestaande afspraak
 * gelezen of getoond, en nooit een inloggegeven gelogd.
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { DAVClient, type DAVCalendar } from "tsdav";
import { busyIntervals } from "./busy";

const serverUrl = "https://caldav.icloud.com";
const spikeCalendarName = "NovaLuxe spike";
const windowDays = 30;

const args = process.argv.slice(2);
const readOnly = args.includes("--alleen-lezen");
const reportPath = args.includes("--rapport") ? args[args.indexOf("--rapport") + 1] : undefined;

try {
  process.loadEnvFile(".env.icloud-spike");
} catch {
  // Geen bestand: dan uit de omgeving.
}

const username = process.env.ICLOUD_SPIKE_USERNAME ?? "";
const password = process.env.ICLOUD_SPIKE_APP_PASSWORD ?? "";
if (!username || !password) {
  stop("Zet ICLOUD_SPIKE_USERNAME en ICLOUD_SPIKE_APP_PASSWORD in .env.icloud-spike.");
}
if (process.env.ICLOUD_SPIKE_BEVESTIG !== "testaccount") {
  stop("Deze spike draait eerst alleen met een test-Apple-ID. Zet ICLOUD_SPIKE_BEVESTIG=testaccount om dat te bevestigen.");
}

/** Haalt inloggegevens uit elke tekst die naar het scherm of een bestand gaat. */
function redact(text: string): string {
  let safe = text;
  for (const secret of [password, username, encodeURIComponent(username)]) {
    if (secret) safe = safe.split(secret).join("[verborgen]");
  }
  return safe;
}

function stop(message: string): never {
  console.error(redact(message));
  process.exit(1);
}

const lines: string[] = [];
function log(line = "") {
  const safe = redact(line);
  lines.push(safe);
  console.log(safe);
}

async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    const result = await run();
    log(`- ${label}: gelukt (${Math.round(performance.now() - started)} ms)`);
    return result;
  } catch (error) {
    log(`- ${label}: mislukt (${Math.round(performance.now() - started)} ms): ${describe(error)}`);
    throw error;
  }
}

function describe(error: unknown): string {
  return redact(error instanceof Error ? error.message : String(error));
}

const icsTime = (at: Date) => at.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function testEvent(uid: string, start: Date, minutes: number): string {
  const end = new Date(start.getTime() + minutes * 60 * 1000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NovaLuxe//iCloud-spike//NL",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsTime(new Date())}`,
    `DTSTART:${icsTime(start)}`,
    `DTEND:${icsTime(end)}`,
    "SUMMARY:NovaLuxe spike-test",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

const isEventCalendar = (calendar: DAVCalendar) =>
  !calendar.components || calendar.components.length === 0 || calendar.components.includes("VEVENT");

const nameOf = (calendar: DAVCalendar) =>
  typeof calendar.displayName === "string" ? calendar.displayName : "(zonder naam)";

async function main() {
  log(`# iCloud-spike, ${new Date().toISOString()}`);
  log();
  log(readOnly ? "Modus: alleen lezen." : "Modus: lezen en schrijven (alleen in de agenda \"NovaLuxe spike\").");
  log();
  log("## Verbinding");

  const client = new DAVClient({
    serverUrl,
    credentials: { username, password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await timed("inloggen bij caldav.icloud.com", () => client.login());

  let calendars = await timed("agenda's ophalen", () => client.fetchCalendars());
  const eventCalendars = calendars.filter(isEventCalendar);
  log(`- agenda's met afspraken: ${eventCalendars.length} (${eventCalendars.map(nameOf).join(", ")})`);
  log(`- ctag aanwezig: ${eventCalendars.filter((c) => c.ctag).length}/${eventCalendars.length}, sync-token aanwezig: ${eventCalendars.filter((c) => c.syncToken).length}/${eventCalendars.length}`);

  // Lezen: alleen begin, einde en bezet.
  log();
  log(`## Lezen (komende ${windowDays} dagen, alleen begin, einde en bezet/vrij)`);
  const from = new Date();
  const to = new Date(from.getTime() + windowDays * 24 * 60 * 60 * 1000);
  const timeRange = { start: from.toISOString(), end: to.toISOString() };
  const texts: string[] = [];
  for (const calendar of eventCalendars) {
    try {
      const objects = await timed(`afspraken ophalen uit "${nameOf(calendar)}"`, () =>
        client.fetchCalendarObjects({ calendar, timeRange }),
      );
      texts.push(...objects.map((object) => String(object.data ?? "")).filter(Boolean));
    } catch {
      // Al gelogd; volgende agenda.
    }
  }
  try {
    const { intervals, stats } = busyIntervals(texts, from, to);
    const hours = intervals.reduce((sum, item) => sum + (item.end.getTime() - item.start.getTime()), 0) / 3_600_000;
    log(`- agenda-objecten: ${texts.length}; afspraken: ${stats.events} (herhalend ${stats.recurring}, uitzonderingen ${stats.exceptions}, hele dag ${stats.allDay}, op vrij ${stats.transparent}, geannuleerd ${stats.cancelled})`);
    log(`- bezette tijdvakken na uitrollen: ${intervals.length}, samen ${hours.toFixed(1)} uur`);
  } catch (error) {
    log(`- uitlezen van begin en einde mislukt: ${describe(error)}`);
  }

  const probe = eventCalendars[0];
  if (probe) {
    try {
      const expanded = await timed(`server-uitrol (expand) op "${nameOf(probe)}"`, () =>
        client.fetchCalendarObjects({ calendar: probe, timeRange, expand: true }),
      );
      const stillRecurring = expanded.filter((object) => /\r?\nRRULE:/.test(String(object.data ?? ""))).length;
      log(`- na expand nog objecten met RRULE: ${stillRecurring} (0 betekent dat de server echt uitrolt)`);
    } catch {
      // Al gelogd.
    }
    try {
      const response = await timed(`free-busy-query op "${nameOf(probe)}"`, () =>
        client.freeBusyQuery({ url: probe.url, timeRange }),
      );
      log(`- free-busy-query status: ${response.status} ${response.ok ? "(ondersteund)" : "(niet ondersteund)"}`);
    } catch {
      // Al gelogd.
    }
  }

  if (readOnly) return;

  // Schrijven, alleen in de eigen testagenda.
  log();
  log(`## Schrijven (agenda "${spikeCalendarName}")`);
  let spike = calendars.find((calendar) => nameOf(calendar) === spikeCalendarName);
  if (!spike) {
    const homeUrl = client.account?.homeUrl;
    if (!homeUrl) throw new Error("Geen agenda-home gevonden om de testagenda in te maken.");
    await timed(`testagenda "${spikeCalendarName}" aanmaken`, () =>
      client.makeCalendar({
        url: new URL(`novaluxe-spike-${randomUUID()}/`, homeUrl).href,
        props: {
          displayname: spikeCalendarName,
          "c:supported-calendar-component-set": { "c:comp": { _attributes: { name: "VEVENT" } } },
        },
      }),
    );
    calendars = await client.fetchCalendars();
    spike = calendars.find((calendar) => nameOf(calendar) === spikeCalendarName);
    if (!spike) throw new Error("De testagenda is aangemaakt maar niet teruggevonden.");
  } else {
    log("- testagenda bestond al");
  }
  const testCalendar: DAVCalendar = spike;
  const before = { ctag: testCalendar.ctag, syncToken: testCalendar.syncToken };

  const uid = `novaluxe-spike-${randomUUID()}`;
  const filename = `${uid}.ics`;
  const url = new URL(filename, testCalendar.url).href;
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
  start.setUTCMinutes(0, 0, 0);

  let created = false;
  try {
    const createResponse = await timed("testafspraak aanmaken", async () => {
      const response = await client.createCalendarObject({ calendar: testCalendar, filename, iCalString: testEvent(uid, start, 30) });
      if (!response.ok) throw new Error(`status ${response.status}`);
      return response;
    });
    created = true;
    log(`- status bij aanmaken: ${createResponse.status}`);

    const fetchOne = async () => (await client.fetchCalendarObjects({ calendar: testCalendar, objectUrls: [url] }))[0];
    const first = await timed("testafspraak teruglezen", async () => {
      const object = await fetchOne();
      if (!object?.etag) throw new Error("geen ETag teruggekregen");
      return object;
    });

    const moved = testEvent(uid, new Date(start.getTime() + 30 * 60 * 1000), 30);
    await timed("wijzigen met de juiste ETag (If-Match)", async () => {
      const response = await client.updateCalendarObject({ calendarObject: { url, data: moved, etag: first.etag } });
      if (!response.ok) throw new Error(`status ${response.status}`);
    });

    const staleResponse = await client.updateCalendarObject({
      calendarObject: { url, data: testEvent(uid, start, 60), etag: first.etag },
    });
    log(
      `- wijzigen met een verouderde ETag: status ${staleResponse.status} ${
        staleResponse.status === 412 ? "(goed: geweigerd, niets stil overschreven)" : "(LET OP: verwacht 412)"
      }`,
    );

    const current = await fetchOne();
    log(`- ETag veranderd na wijzigen: ${current?.etag && current.etag !== first.etag ? "ja" : "nee"}`);

    calendars = await client.fetchCalendars();
    const afterChange = calendars.find((calendar) => calendar.url === testCalendar.url);
    log(`- ctag veranderd: ${afterChange?.ctag && afterChange.ctag !== before.ctag ? "ja" : "nee"}; sync-token veranderd: ${afterChange?.syncToken && afterChange.syncToken !== before.syncToken ? "ja" : "nee"}`);

    await timed("testafspraak verwijderen (If-Match)", async () => {
      const response = await client.deleteCalendarObject({ calendarObject: { url, etag: current?.etag } });
      if (!response.ok) throw new Error(`status ${response.status}`);
    });
    created = false;
    const gone = await fetchOne().catch(() => undefined);
    log(`- testafspraak na verwijderen nog te vinden: ${gone?.data ? "ja (LET OP)" : "nee"}`);
  } finally {
    if (created) {
      // Opruimen als er halverwege iets misging; zonder ETag-voorwaarde, alleen voor de eigen testafspraak.
      await client.deleteCalendarObject({ calendarObject: { url } }).catch(() => undefined);
      log("- testafspraak opgeruimd na een fout");
    }
  }
}

main()
  .catch((error: unknown) => {
    log();
    log(`Gestopt: ${describe(error)}`);
    process.exitCode = 1;
  })
  .finally(() => {
    if (reportPath) {
      writeFileSync(reportPath, `${lines.join("\n")}\n`);
      console.log(`\nRapport weggeschreven naar ${reportPath}`);
    }
  });
