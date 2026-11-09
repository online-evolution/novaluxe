import { sql } from "drizzle-orm";
import { check, index, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
import { appointments } from "./booking";
import { id, timestamptz, timestamps } from "./columns";
import { contactMessages } from "./contact";

/*
 * E-mail (Fase 13): de site mailt vanaf Jessies eigen Gmail-adres. Zie
 * docs/besluiten.md, E-mail.
 */

/**
 * De Gmail-koppeling. Eén rij (id = 1). Het app-wachtwoord staat alleen
 * versleuteld (src/server/secret.ts) en wordt nooit teruggetoond of gelogd.
 */
export const mailConnection = pgTable(
  "mail_connection",
  {
    id: smallint().primaryKey().default(1),
    /** Het Gmail-adres: afzender én het adres waarop klanten antwoorden. */
    address: text().notNull(),
    encryptedPassword: text().notNull(),
    /** Waar meldingen voor Jessie heen gaan; leeg = het Gmail-adres zelf. */
    notifyAddress: text(),
    lastSentAt: timestamptz(),
    /** Laatste fout met de koppeling zelf, in gewone taal; leeg als het goed ging. */
    lastError: text(),
    ...timestamps,
  },
  (t) => [check("mail_connection_single", sql`${t.id} = 1`)],
);

export const mailKinds = [
  /** Aan Jessie: nieuwe online aanvraag. */
  "aanvraag",
  /** Aan Jessie: nieuw bericht via het contactformulier. */
  "bericht",
  /** Aan de klant. */
  "bevestiging",
  "afwijzing",
  "annulering",
  "verplaatsing",
] as const;

export const mailStatuses = ["wachtend", "bezig", "verzonden", "mislukt", "overgeslagen"] as const;

/**
 * Elke mail die de site verstuurt (of bewust niet). De inhoud en het adres
 * staan hier niet: die worden bij het versturen uit de afspraak of het
 * bericht gehaald. Zo blijven er geen kopieën van persoonsgegevens achter, en
 * verdwijnt de regel vanzelf met de afspraak of het bericht.
 */
export const mailMessages = pgTable(
  "mail_messages",
  {
    id: id(),
    kind: text({ enum: mailKinds }).notNull(),
    appointmentId: uuid().references(() => appointments.id, { onDelete: "cascade" }),
    contactMessageId: uuid().references(() => contactMessages.id, { onDelete: "cascade" }),
    status: text({ enum: mailStatuses }).notNull().default("wachtend"),
    attempts: smallint().notNull().default(0),
    /** Waarom niet verstuurd, in gewone taal. */
    error: text(),
    sentAt: timestamptz(),
    ...timestamps,
  },
  (t) => [index().on(t.appointmentId), index().on(t.status, t.createdAt)],
);
