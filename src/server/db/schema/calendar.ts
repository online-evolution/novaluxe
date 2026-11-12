import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { appointments } from "./booking";
import { timestamptz, timestamps } from "./columns";

/*
 * iCloud-koppeling (na de geslaagde spike, docs/icloud-spike.md). Neon blijft
 * de bron van waarheid; iCloud is een synchronisatielaag.
 */

/**
 * De koppeling met Jessies iCloud-agenda. Eén rij (id = 1). Het
 * app-specifieke wachtwoord staat alleen versleuteld (AES-256-GCM, sleutel
 * afgeleid van AUTH_SECRET; src/server/calendar/secret.ts) en wordt nooit
 * teruggetoond of gelogd.
 */
export const calendarConnection = pgTable(
  "calendar_connection",
  {
    id: smallint().primaryKey().default(1),
    appleId: text().notNull(),
    encryptedPassword: text().notNull(),
    /** Agenda "NovaLuxe" waarin bevestigde afspraken komen. */
    targetCalendarUrl: text().notNull(),
    /** Agenda's waarvan de afspraken meetellen als bezet. */
    busyCalendarUrls: text().array().notNull().default([]),
    lastSyncAt: timestamptz(),
    /** Laatste fout in gewone taal; leeg als het goed ging. */
    lastError: text(),
    /** Claim zodat er nooit twee synchronisaties tegelijk lopen. */
    syncStartedAt: timestamptz(),
    ...timestamps,
  },
  (t) => [check("calendar_connection_single", sql`${t.id} = 1`)],
);

/**
 * Bezette tijden uit Jessies eigen agenda's: begin, einde, de titel en de
 * naam van de agenda. Beschrijving, locatie en deelnemers lezen we niet.
 */
export const calendarBusyBlocks = pgTable(
  "calendar_busy_blocks",
  {
    id: uuid().primaryKey().defaultRandom(),
    startAt: timestamptz().notNull(),
    endAt: timestamptz().notNull(),
    allDay: boolean().notNull().default(false),
    /** Titel in de agenda, bijvoorbeeld "11.00 Eveline". */
    title: text(),
    /** Naam van de agenda, bijvoorbeeld "Werk". */
    calendarName: text(),
  },
  (t) => [index().on(t.startAt, t.endAt)],
);

/**
 * Welke afspraak bij welk agenda-item in de agenda "NovaLuxe" hoort. Een
 * wijziging op de iPhone overschrijft nooit stil de afspraak: de koppeling
 * krijgt dan `drift` en Jessie kiest in het beheer wat er gebeurt.
 */
export const calendarEventLinks = pgTable("calendar_event_links", {
  appointmentId: uuid()
    .primaryKey()
    .references(() => appointments.id, { onDelete: "cascade" }),
  url: text().notNull(),
  etag: text(),
  syncedStartAt: timestamptz().notNull(),
  syncedEndAt: timestamptz().notNull(),
  /** Afwijking op de iPhone: verplaatst (met de tijden daar) of verwijderd. */
  drift: text({ enum: ["verplaatst", "verwijderd"] }),
  remoteStartAt: timestamptz(),
  remoteEndAt: timestamptz(),
  ...timestamps,
});
