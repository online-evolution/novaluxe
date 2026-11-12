import "server-only";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { DAVClient, type DAVCalendar, type DAVCalendarObject } from "tsdav";
import { busyIntervals } from "@/lib/calendar/busy";
import {
  appointmentEvent,
  eventTimes,
  eventUid,
  sameTimes,
} from "@/lib/calendar/event";
import { getDb } from "@/server/db";
import {
  appointments,
  calendarBusyBlocks,
  calendarConnection,
  calendarEventLinks,
  customers,
} from "@/server/db/schema";
import { decryptSecret, encryptSecret } from "./secret";

/*
 * Synchronisatie met Jessies iCloud-agenda. Neon is de bron van waarheid:
 *   - bevestigde afspraken komen in de agenda "NovaLuxe" (en gaan er weer uit
 *     bij annuleren); verplaatsen in NovaLuxe verplaatst het agenda-item;
 *   - uit de gekozen eigen agenda's lezen we begin, einde en titel (plus de
 *     naam van de agenda); die tijden zijn online niet te boeken en Jessie
 *     ziet ze in het beheer;
 *   - verschuift of verwijdert Jessie een NovaLuxe-item op haar iPhone, dan
 *     nemen we dat niet stil over: de koppeling krijgt een afwijking en Jessie
 *     kiest in het beheer. Schrijven gebeurt altijd met If-Match (ETag).
 *
 * Wanneer: na elke wijziging in het beheer, als de laatste ronde ouder is dan
 * een paar minuten wanneer iemand reserveert of het beheer opent (`after`),
 * en elk kwartier via de vaste taak van Vercel (`/api/cron/agenda`).
 */

const serverUrl = "https://caldav.icloud.com";
export const novaluxeCalendarName = "NovaLuxe";
const ignoredCalendarNames = new Set([novaluxeCalendarName, "NovaLuxe spike"]);
const busyWindowDays = 120;
/** Een ronde die langer "loopt" dan dit is vastgelopen en mag opnieuw. */
const claimTimeoutMinutes = 3;
const minute = 60 * 1000;

export type CalendarChoice = { url: string; name: string; busy: boolean };

const nameOf = (calendar: DAVCalendar) =>
  typeof calendar.displayName === "string" && calendar.displayName
    ? calendar.displayName
    : "(zonder naam)";

const isEventCalendar = (calendar: DAVCalendar) =>
  !calendar.components ||
  calendar.components.length === 0 ||
  calendar.components.includes("VEVENT");

const pathOf = (url: string) =>
  decodeURIComponent(new URL(url, serverUrl).pathname);

async function login(appleId: string, password: string): Promise<DAVClient> {
  const client = new DAVClient({
    serverUrl,
    credentials: { username: appleId, password },
    authMethod: "Basic",
    defaultAccountType: "caldav",
  });
  await client.login();
  return client;
}

/** Foutmelding in gewone taal, zonder technische details of gegevens. */
function friendly(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  if (/401|Unauthorized|Invalid credentials/i.test(text)) {
    return "Inloggen bij iCloud lukt niet meer. Is het app-specifieke wachtwoord ingetrokken? Koppel de agenda dan opnieuw.";
  }
  return "Synchroniseren met iCloud is niet gelukt. NovaLuxe probeert het over een paar minuten opnieuw.";
}

export async function getConnection() {
  const [row] = await getDb()
    .select()
    .from(calendarConnection)
    .where(eq(calendarConnection.id, 1))
    .limit(1);
  return row ?? null;
}

async function connectedClient() {
  const connection = await getConnection();
  if (!connection) return null;
  const password = decryptSecret(
    connection.encryptedPassword,
    connection.appleId,
  );
  return { connection, client: await login(connection.appleId, password) };
}

/**
 * Koppelen: inloggen, de agenda "NovaLuxe" vinden of maken, en standaard alle
 * eigen agenda's laten meetellen als bezet. Het wachtwoord wordt alleen
 * versleuteld opgeslagen.
 */
export async function connectCalendar(
  appleId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let client: DAVClient;
  try {
    client = await login(appleId, password);
  } catch (error) {
    return {
      ok: false,
      message: /401|Unauthorized|Invalid credentials/i.test(
        error instanceof Error ? error.message : String(error),
      )
        ? "Inloggen bij iCloud lukt niet. Controleer het Apple ID en gebruik een app-specifiek wachtwoord, niet het gewone wachtwoord."
        : "iCloud is nu niet bereikbaar. Probeer het over een paar minuten opnieuw.",
    };
  }

  let calendars = (await client.fetchCalendars()).filter(isEventCalendar);
  let target = calendars.find(
    (calendar) => nameOf(calendar) === novaluxeCalendarName,
  );
  if (!target) {
    const homeUrl = client.account?.homeUrl;
    if (!homeUrl)
      return {
        ok: false,
        message: "In deze iCloud-account is geen agenda gevonden.",
      };
    const responses = await client.makeCalendar({
      url: new URL(`novaluxe-${crypto.randomUUID()}/`, homeUrl).href,
      props: {
        displayname: novaluxeCalendarName,
        "c:supported-calendar-component-set": {
          "c:comp": { _attributes: { name: "VEVENT" } },
        },
      },
    });
    if (responses.some((response) => !response.ok)) {
      return {
        ok: false,
        message: "De agenda “NovaLuxe” kon niet worden aangemaakt in iCloud.",
      };
    }
    calendars = (await client.fetchCalendars()).filter(isEventCalendar);
    target = calendars.find(
      (calendar) => nameOf(calendar) === novaluxeCalendarName,
    );
    if (!target)
      return {
        ok: false,
        message: "De agenda “NovaLuxe” is aangemaakt maar niet teruggevonden.",
      };
  }

  const busy = calendars
    .filter((calendar) => !ignoredCalendarNames.has(nameOf(calendar)))
    .map((calendar) => calendar.url);
  const values = {
    appleId,
    encryptedPassword: encryptSecret(password, appleId),
    targetCalendarUrl: target.url,
    busyCalendarUrls: busy,
    lastSyncAt: null,
    lastError: null,
    syncStartedAt: null,
  };
  await getDb()
    .insert(calendarConnection)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: calendarConnection.id, set: values });
  return { ok: true };
}

/**
 * Ontkoppelen: het opgeslagen wachtwoord, de bezette tijden en de koppelingen
 * met agenda-items worden gewist. De items in de agenda "NovaLuxe" blijven in
 * iCloud staan.
 */
export async function disconnectCalendar(): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.delete(calendarEventLinks);
    await tx.delete(calendarBusyBlocks);
    await tx.delete(calendarConnection);
  });
}

/** De eigen agenda's om uit te kiezen welke meetellen als bezet (live uit iCloud). */
export async function listCalendarChoices(): Promise<CalendarChoice[] | null> {
  const connected = await connectedClient().catch(() => null);
  if (!connected) return null;
  const calendars = (await connected.client.fetchCalendars()).filter(
    isEventCalendar,
  );
  return calendars
    .filter(
      (calendar) =>
        !ignoredCalendarNames.has(nameOf(calendar)) &&
        calendar.url !== connected.connection.targetCalendarUrl,
    )
    .map((calendar) => ({
      url: calendar.url,
      name: nameOf(calendar),
      busy: connected.connection.busyCalendarUrls.includes(calendar.url),
    }));
}

export async function saveBusyCalendars(urls: string[]): Promise<void> {
  await getDb()
    .update(calendarConnection)
    .set({ busyCalendarUrls: urls, lastSyncAt: null })
    .where(eq(calendarConnection.id, 1));
}

/** Synchroniseert als de laatste ronde ouder is dan `maxAgeMinutes`. Stil bij geen koppeling. */
export async function syncCalendarIfStale(maxAgeMinutes = 5): Promise<void> {
  const connection = await getConnection().catch(() => null);
  if (!connection) return;
  if (
    connection.lastSyncAt &&
    Date.now() - connection.lastSyncAt.getTime() < maxAgeMinutes * minute
  )
    return;
  await syncCalendar();
}

export type SyncResult = { ok: boolean; message: string };

/** Eén volledige ronde. Er loopt er nooit meer dan één tegelijk. */
export async function syncCalendar(): Promise<SyncResult> {
  const db = getDb();
  const [claimed] = await db
    .update(calendarConnection)
    .set({ syncStartedAt: new Date() })
    .where(
      and(
        eq(calendarConnection.id, 1),
        or(
          isNull(calendarConnection.syncStartedAt),
          lt(
            calendarConnection.syncStartedAt,
            new Date(Date.now() - claimTimeoutMinutes * minute),
          ),
        ),
      ),
    )
    .returning();
  if (!claimed) {
    const exists = await getConnection();
    return exists
      ? {
          ok: true,
          message: "Er loopt al een synchronisatie; die neemt dit mee.",
        }
      : { ok: false, message: "De agenda is niet gekoppeld." };
  }

  try {
    const client = await login(
      claimed.appleId,
      decryptSecret(claimed.encryptedPassword, claimed.appleId),
    );
    await syncBusy(client, claimed.busyCalendarUrls, claimed.targetCalendarUrl);
    const drifts = await syncAppointments(client, claimed.targetCalendarUrl);
    await db
      .update(calendarConnection)
      .set({ lastSyncAt: new Date(), lastError: null, syncStartedAt: null })
      .where(eq(calendarConnection.id, 1));
    return {
      ok: true,
      message:
        drifts > 0
          ? `Gesynchroniseerd. ${drifts} afspraak${drifts === 1 ? "" : "en"} wijkt af op de iPhone.`
          : "Gesynchroniseerd.",
    };
  } catch (error) {
    // In de serverlog alleen de technische melding, nooit gegevens of wachtwoorden.
    console.error(
      "iCloud-synchronisatie mislukt",
      (error instanceof Error ? error.message : String(error))
        .split(claimed.appleId)
        .join("[apple-id]"),
    );
    const message = friendly(error);
    await db
      .update(calendarConnection)
      .set({ lastError: message, syncStartedAt: null })
      .where(eq(calendarConnection.id, 1));
    return { ok: false, message };
  }
}

/** Bezette tijden uit de eigen agenda's: alles vervangen, met titel en agendanaam. */
async function syncBusy(client: DAVClient, urls: string[], targetUrl: string) {
  const from = new Date(Date.now() - 24 * 60 * minute);
  const to = new Date(Date.now() + busyWindowDays * 24 * 60 * minute);
  const names = new Map(
    (await client.fetchCalendars()).map((calendar) => [pathOf(calendar.url), nameOf(calendar)]),
  );
  const rows: (typeof calendarBusyBlocks.$inferInsert)[] = [];
  for (const url of urls.filter((item) => item !== targetUrl)) {
    const objects = await client.fetchCalendarObjects({
      calendar: { url } as DAVCalendar,
      timeRange: { start: from.toISOString(), end: to.toISOString() },
    });
    const texts = objects.map((object) => String(object.data ?? "")).filter(Boolean);
    const calendarName = names.get(pathOf(url)) ?? null;
    for (const item of busyIntervals(texts, from, to).intervals) {
      rows.push({ startAt: item.start, endAt: item.end, allDay: item.allDay, title: item.title, calendarName });
    }
  }
  await getDb().transaction(async (tx) => {
    await tx.delete(calendarBusyBlocks);
    if (rows.length > 0) await tx.insert(calendarBusyBlocks).values(rows);
  });
}

type WantedAppointment = {
  id: string;
  startAt: Date;
  endAt: Date;
  treatmentName: string;
  variantLabel: string | null;
  customerName: string;
};

function eventFor(appointment: WantedAppointment) {
  const treatment = appointment.variantLabel
    ? `${appointment.treatmentName}, ${appointment.variantLabel}`
    : appointment.treatmentName;
  return appointmentEvent({
    appointmentId: appointment.id,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    title: `${treatment} – ${appointment.customerName}`,
    description:
      "Afspraak via NovaLuxe. Verplaatsen of annuleren doe je in het NovaLuxe-beheer.",
  });
}

async function fetchObjects(
  client: DAVClient,
  targetUrl: string,
  urls: string[],
) {
  if (urls.length === 0) return new Map<string, DAVCalendarObject>();
  const objects = await client.fetchCalendarObjects({
    calendar: { url: targetUrl } as DAVCalendar,
    objectUrls: urls,
  });
  return new Map(
    objects
      .filter((object) => object.data)
      .map((object) => [pathOf(object.url), object]),
  );
}

async function fetchOne(client: DAVClient, targetUrl: string, url: string) {
  return (await fetchObjects(client, targetUrl, [url])).get(pathOf(url));
}

/** Afspraken naar de agenda "NovaLuxe". Geeft het aantal afwijkingen terug. */
async function syncAppointments(
  client: DAVClient,
  targetUrl: string,
): Promise<number> {
  const db = getDb();
  const wanted = await db
    .select({
      id: appointments.id,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      treatmentName: appointments.treatmentName,
      variantLabel: appointments.variantLabel,
      customerName: customers.name,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(
      and(
        eq(appointments.status, "confirmed"),
        gt(appointments.endAt, new Date(Date.now() - 24 * 60 * minute)),
      ),
    );
  const wantedById = new Map(wanted.map((item) => [item.id, item]));
  const links = await db.select().from(calendarEventLinks);
  const remote = await fetchObjects(
    client,
    targetUrl,
    links.map((link) => link.url),
  );

  for (const link of links) {
    const appointment = wantedById.get(link.appointmentId);
    const object = remote.get(pathOf(link.url));

    if (!appointment) {
      // Niet (meer) bevestigd in NovaLuxe: het item hoort weg.
      if (object) {
        const response = await client.deleteCalendarObject({
          calendarObject: { url: object.url, etag: object.etag },
        });
        if (!response.ok && response.status !== 404) continue;
      }
      await db
        .delete(calendarEventLinks)
        .where(eq(calendarEventLinks.appointmentId, link.appointmentId));
      continue;
    }
    if (link.drift) continue; // Wacht op Jessies keuze.

    if (!object) {
      await db
        .update(calendarEventLinks)
        .set({ drift: "verwijderd", remoteStartAt: null, remoteEndAt: null })
        .where(eq(calendarEventLinks.appointmentId, link.appointmentId));
      continue;
    }

    if (object.etag !== link.etag) {
      const times = eventTimes(String(object.data));
      const synced = { startAt: link.syncedStartAt, endAt: link.syncedEndAt };
      if (times && !sameTimes(times, synced)) {
        await db
          .update(calendarEventLinks)
          .set({
            drift: "verplaatst",
            remoteStartAt: times.startAt,
            remoteEndAt: times.endAt,
            etag: object.etag,
          })
          .where(eq(calendarEventLinks.appointmentId, link.appointmentId));
        continue;
      }
      // Alleen iets anders gewijzigd (bijvoorbeeld een melding): niets aan de hand.
      await db
        .update(calendarEventLinks)
        .set({ etag: object.etag })
        .where(eq(calendarEventLinks.appointmentId, link.appointmentId));
      link.etag = object.etag ?? null;
    }

    if (
      !sameTimes(appointment, {
        startAt: link.syncedStartAt,
        endAt: link.syncedEndAt,
      })
    ) {
      // Verplaatst in NovaLuxe: het item volgt, alleen als het op de iPhone niet ook veranderd is.
      const response = await client.updateCalendarObject({
        calendarObject: {
          url: object.url,
          data: eventFor(appointment),
          etag: link.etag ?? undefined,
        },
      });
      if (response.status === 412) {
        const fresh = await fetchOne(client, targetUrl, link.url);
        const times = fresh ? eventTimes(String(fresh.data)) : null;
        await db
          .update(calendarEventLinks)
          .set(
            fresh
              ? {
                  drift: "verplaatst",
                  remoteStartAt: times?.startAt ?? null,
                  remoteEndAt: times?.endAt ?? null,
                  etag: fresh.etag,
                }
              : { drift: "verwijderd", remoteStartAt: null, remoteEndAt: null },
          )
          .where(eq(calendarEventLinks.appointmentId, link.appointmentId));
        continue;
      }
      if (!response.ok)
        throw new Error(`Bijwerken agenda-item: status ${response.status}`);
      const fresh = await fetchOne(client, targetUrl, link.url);
      await db
        .update(calendarEventLinks)
        .set({
          syncedStartAt: appointment.startAt,
          syncedEndAt: appointment.endAt,
          etag: fresh?.etag ?? null,
        })
        .where(eq(calendarEventLinks.appointmentId, link.appointmentId));
    }
  }

  // Nieuwe bevestigde afspraken zonder agenda-item.
  const linked = new Set(links.map((link) => link.appointmentId));
  for (const appointment of wanted.filter((item) => !linked.has(item.id))) {
    await writeEvent(client, targetUrl, appointment);
  }

  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(calendarEventLinks)
    .where(sql`${calendarEventLinks.drift} is not null`);
  return row?.total ?? 0;
}

/** Agenda-item maken (of een bestaand item met dezelfde UID overnemen) en de koppeling opslaan. */
async function writeEvent(
  client: DAVClient,
  targetUrl: string,
  appointment: WantedAppointment,
) {
  const filename = `${eventUid(appointment.id)}.ics`;
  const url = new URL(filename, targetUrl).href;
  const response = await client.createCalendarObject({
    calendar: { url: targetUrl } as DAVCalendar,
    filename,
    iCalString: eventFor(appointment),
  });
  if (!response.ok && response.status !== 412)
    throw new Error(`Aanmaken agenda-item: status ${response.status}`);
  const object = await fetchOne(client, targetUrl, url);
  if (!object) throw new Error("Agenda-item niet teruggevonden na aanmaken.");
  const times = eventTimes(String(object.data));
  // Bestond het item al (412) met andere tijden, dan zetten we de bekende tijden als vertrekpunt;
  // de volgende ronde ziet het verschil en werkt het item bij.
  await getDb()
    .insert(calendarEventLinks)
    .values({
      appointmentId: appointment.id,
      url,
      etag: object.etag ?? null,
      syncedStartAt: times?.startAt ?? appointment.startAt,
      syncedEndAt: times?.endAt ?? appointment.endAt,
    })
    .onConflictDoNothing();
}

/** Afwijkingen op de iPhone, voor het beheer. */
export async function listDrifts() {
  return getDb()
    .select({
      appointmentId: calendarEventLinks.appointmentId,
      drift: calendarEventLinks.drift,
      remoteStartAt: calendarEventLinks.remoteStartAt,
      remoteEndAt: calendarEventLinks.remoteEndAt,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      treatmentName: appointments.treatmentName,
      customerName: customers.name,
    })
    .from(calendarEventLinks)
    .innerJoin(
      appointments,
      eq(calendarEventLinks.appointmentId, appointments.id),
    )
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(sql`${calendarEventLinks.drift} is not null`)
    .orderBy(appointments.startAt);
}

export async function countDrifts(): Promise<number> {
  const [row] = await getDb()
    .select({ total: sql<number>`count(*)::int` })
    .from(calendarEventLinks)
    .where(sql`${calendarEventLinks.drift} is not null`);
  return row?.total ?? 0;
}

/**
 * Terugzetten: het agenda-item krijgt weer de tijd uit NovaLuxe (of wordt
 * opnieuw gemaakt als het op de iPhone verwijderd is).
 */
export async function restoreEvent(
  appointmentId: string,
): Promise<{ ok: boolean; message: string }> {
  const connected = await connectedClient();
  if (!connected) return { ok: false, message: "De agenda is niet gekoppeld." };
  const { client, connection } = connected;
  const db = getDb();
  const [link] = await db
    .select()
    .from(calendarEventLinks)
    .where(eq(calendarEventLinks.appointmentId, appointmentId))
    .limit(1);
  const [appointment] = await db
    .select({
      id: appointments.id,
      startAt: appointments.startAt,
      endAt: appointments.endAt,
      treatmentName: appointments.treatmentName,
      variantLabel: appointments.variantLabel,
      customerName: customers.name,
    })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.status, "confirmed"),
      ),
    )
    .limit(1);
  if (!link || !appointment)
    return { ok: false, message: "Deze afspraak bestaat niet (meer)." };

  const object = await fetchOne(client, connection.targetCalendarUrl, link.url);
  if (object) {
    const response = await client.updateCalendarObject({
      calendarObject: {
        url: object.url,
        data: eventFor(appointment),
        etag: object.etag,
      },
    });
    if (!response.ok)
      return {
        ok: false,
        message: "Terugzetten is niet gelukt; probeer het opnieuw.",
      };
    const fresh = await fetchOne(
      client,
      connection.targetCalendarUrl,
      link.url,
    );
    await db
      .update(calendarEventLinks)
      .set({
        drift: null,
        remoteStartAt: null,
        remoteEndAt: null,
        syncedStartAt: appointment.startAt,
        syncedEndAt: appointment.endAt,
        etag: fresh?.etag ?? null,
      })
      .where(eq(calendarEventLinks.appointmentId, appointmentId));
  } else {
    await db
      .delete(calendarEventLinks)
      .where(eq(calendarEventLinks.appointmentId, appointmentId));
    await writeEvent(client, connection.targetCalendarUrl, appointment);
  }
  return { ok: true, message: "Teruggezet in de iPhone-agenda." };
}

/** Na "iPhone volgen": de afspraak heeft nu de tijd van de iPhone; de koppeling is weer gelijk. */
export async function acceptRemoteTimes(appointmentId: string): Promise<void> {
  const db = getDb();
  const [link] = await db
    .select()
    .from(calendarEventLinks)
    .where(eq(calendarEventLinks.appointmentId, appointmentId))
    .limit(1);
  if (!link?.remoteStartAt || !link.remoteEndAt) return;
  await db
    .update(calendarEventLinks)
    .set({
      drift: null,
      syncedStartAt: link.remoteStartAt,
      syncedEndAt: link.remoteEndAt,
      remoteStartAt: null,
      remoteEndAt: null,
    })
    .where(eq(calendarEventLinks.appointmentId, appointmentId));
}

/** Na "afspraak annuleren" bij een op de iPhone verwijderd item: de koppeling is klaar. */
export async function forgetLink(appointmentId: string): Promise<void> {
  await getDb()
    .delete(calendarEventLinks)
    .where(eq(calendarEventLinks.appointmentId, appointmentId));
}
