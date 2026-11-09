import { sql } from "drizzle-orm";
import { check, index, pgTable, text } from "drizzle-orm/pg-core";
import { id, timestamptz } from "./columns";

/**
 * Berichten via het contactformulier. Jessie leest ze in het beheer; zolang
 * e-mail (Fase 13) er niet is, komt er geen melding per mail. Ze blijven staan
 * tot Jessie ze verwijdert.
 * TODO(content): bewaartermijn vaststellen en automatisch opruimen (PROJECT-TODOS.md).
 */
export const contactMessages = pgTable(
  "contact_messages",
  {
    id: id(),
    name: text().notNull(),
    /** Minstens één van e-mail en telefoon is ingevuld (ook als databaseregel). */
    email: text(),
    phone: text(),
    message: text().notNull(),
    readAt: timestamptz(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [
    index().on(t.createdAt),
    check("contact_messages_reachable", sql`${t.email} is not null or ${t.phone} is not null`),
  ],
);
