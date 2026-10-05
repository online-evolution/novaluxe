import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { treatmentOptions, treatments, treatmentVariants } from "./catalog";
import { id, timestamptz, timestamps } from "./columns";

export const customers = pgTable(
  "customers",
  {
    id: id(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    /** Alleen zichtbaar voor Jessie. */
    internalNotes: text(),
    ...timestamps,
  },
  // Eén klant per e-mailadres, ongeacht hoofdletters.
  (t) => [uniqueIndex("customers_email_unique").on(sql`lower(${t.email})`)],
);

/**
 * Een afspraak is pas definitief na acceptatie door Jessie.
 * `expired`: niet op tijd beoordeeld; het tijdslot is weer vrij.
 */
export const appointmentStatus = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
  "no_show",
  "expired",
]);

export const appointmentSource = pgEnum("appointment_source", ["online", "admin", "release"]);

/**
 * Overlap tussen `pending` en `confirmed` afspraken wordt door de database
 * geweigerd (exclusion constraint `appointments_no_overlap`, zie de migratie
 * met eigen SQL in /drizzle).
 */
export const appointments = pgTable(
  "appointments",
  {
    id: id(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    treatmentId: uuid()
      .notNull()
      .references(() => treatments.id, { onDelete: "restrict" }),
    variantId: uuid()
      .notNull()
      .references(() => treatmentVariants.id, { onDelete: "restrict" }),
    startAt: timestamptz().notNull(),
    endAt: timestamptz().notNull(),
    status: appointmentStatus().notNull().default("pending"),
    /** Tot wanneer een `pending` aanvraag het slot vasthoudt; nooit na `startAt`. */
    expiresAt: timestamptz(),
    source: appointmentSource().notNull().default("online"),
    releaseId: uuid().references((): AnyPgColumn => extensionReleases.id, {
      onDelete: "set null",
    }),

    // Momentopname bij het aanvragen: latere prijswijzigingen raken deze afspraak niet.
    treatmentName: text().notNull(),
    variantLabel: text().notNull(),
    /** Totaal exclusief nail art (die is per nagel en wordt door Jessie afgestemd). */
    priceCents: integer(),
    durationMinutes: smallint().notNull(),

    nailArtRequested: boolean().notNull().default(false),
    nailArtDescription: text(),
    customerNotes: text(),
    internalNotes: text(),
    decidedAt: timestamptz(),
    ...timestamps,
  },
  (t) => [
    index().on(t.startAt),
    index().on(t.status, t.startAt),
    index().on(t.customerId),
    check("appointments_range_check", sql`${t.endAt} > ${t.startAt}`),
    check(
      "appointments_pending_expiry_check",
      sql`${t.status} <> 'pending' or (${t.expiresAt} is not null and ${t.expiresAt} <= ${t.startAt})`,
    ),
    check(
      "appointments_nail_art_check",
      sql`${t.nailArtRequested} or ${t.nailArtDescription} is null`,
    ),
  ],
);

/** Gekozen opties per afspraak, met momentopname van naam, prijs en duur. */
export const appointmentOptions = pgTable(
  "appointment_options",
  {
    appointmentId: uuid()
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    optionId: uuid()
      .notNull()
      .references(() => treatmentOptions.id, { onDelete: "restrict" }),
    name: text().notNull(),
    priceCents: integer(),
    durationMinutes: smallint().notNull(),
  },
  (t) => [primaryKey({ columns: [t.appointmentId, t.optionId] })],
);

export const appointmentActor = pgEnum("appointment_actor", ["customer", "admin", "system"]);

/** Logboek van statuswijzigingen, zodat Jessie kan terugzien wat er gebeurde. */
export const appointmentEvents = pgTable(
  "appointment_events",
  {
    id: id(),
    appointmentId: uuid()
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    fromStatus: appointmentStatus(),
    toStatus: appointmentStatus().notNull(),
    actor: appointmentActor().notNull(),
    note: text(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.appointmentId, t.createdAt)],
);

/**
 * Vrijgave voor een nieuwe extensionsplaatsing na het gratis consult.
 * De klant krijgt een eenmalige link; alleen de hash van het token staat hier.
 * Een aanbetaling is alleen een status die Jessie bijhoudt (geen betaalintegratie).
 */
export const extensionReleases = pgTable(
  "extension_releases",
  {
    id: id(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    consultAppointmentId: uuid().references((): AnyPgColumn => appointments.id, {
      onDelete: "set null",
    }),
    variantId: uuid()
      .notNull()
      .references(() => treatmentVariants.id, { onDelete: "restrict" }),
    /** Door Jessie vastgesteld; kan afwijken van de standaardvariant. */
    priceCents: integer().notNull(),
    durationMinutes: smallint().notNull(),
    colourNotes: text(),
    depositCents: integer(),
    depositPaidAt: timestamptz(),
    tokenHash: text().notNull().unique(),
    expiresAt: timestamptz().notNull(),
    usedAt: timestamptz(),
    revokedAt: timestamptz(),
    ...timestamps,
  },
  (t) => [
    index().on(t.customerId),
    check("extension_releases_price_check", sql`${t.priceCents} >= 0`),
    check("extension_releases_duration_check", sql`${t.durationMinutes} > 0`),
  ],
);
