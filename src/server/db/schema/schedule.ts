import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  time,
} from "drizzle-orm/pg-core";
import { id, timestamptz, timestamps } from "./columns";

/**
 * Reguliere openingstijden in lokale tijd (Europe/Amsterdam).
 * Meerdere rijen per dag mogen: het gat ertussen is een vaste pauze.
 * Geen rijen voor een dag = gesloten.
 */
export const businessHours = pgTable(
  "business_hours",
  {
    id: id(),
    /** ISO-weekdag: 1 = maandag … 7 = zondag. */
    weekday: smallint().notNull(),
    opensAt: time().notNull(),
    closesAt: time().notNull(),
    ...timestamps,
  },
  (t) => [
    index().on(t.weekday),
    check("business_hours_weekday_check", sql`${t.weekday} between 1 and 7`),
    check("business_hours_range_check", sql`${t.closesAt} > ${t.opensAt}`),
  ],
);

export const exceptionKind = pgEnum("exception_kind", ["closed", "custom_hours"]);

/**
 * Afwijking voor één datum: hele dag dicht, of andere tijden (ook op een dag
 * die normaal dicht is). Meerdere `custom_hours`-rijen per datum mogen.
 */
export const availabilityExceptions = pgTable(
  "availability_exceptions",
  {
    id: id(),
    date: date({ mode: "string" }).notNull(),
    kind: exceptionKind().notNull(),
    opensAt: time(),
    closesAt: time(),
    /** Alleen zichtbaar voor Jessie. */
    note: text(),
    ...timestamps,
  },
  (t) => [
    index().on(t.date),
    check(
      "availability_exceptions_shape_check",
      sql`(${t.kind} = 'closed' and ${t.opensAt} is null and ${t.closesAt} is null)
        or (${t.kind} = 'custom_hours' and ${t.opensAt} is not null and ${t.closesAt} > ${t.opensAt})`,
    ),
  ],
);

export const blockKind = pgEnum("block_kind", ["break", "vacation", "personal", "other"]);

/** Geblokkeerde tijd binnen of buiten openingstijden: pauze, vakantie, privé. */
export const blockedPeriods = pgTable(
  "blocked_periods",
  {
    id: id(),
    startAt: timestamptz().notNull(),
    endAt: timestamptz().notNull(),
    kind: blockKind().notNull().default("other"),
    /** Alleen zichtbaar voor Jessie. */
    note: text(),
    ...timestamps,
  },
  (t) => [
    index().on(t.startAt, t.endAt),
    check("blocked_periods_range_check", sql`${t.endAt} > ${t.startAt}`),
  ],
);

/**
 * Instellingen die Jessie zelf beheert. De vorm en standaardwaarden staan in
 * src/server/settings.ts en worden bij lezen met Zod gecontroleerd.
 */
export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamptz()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
