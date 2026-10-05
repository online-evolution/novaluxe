import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./columns";

export const treatmentCategory = pgEnum("treatment_category", [
  "nails",
  "extensions",
]);

/** Kolom in de prijstabel: losse behandeling, nieuwe set of opvullen. */
export const variantKind = pgEnum("variant_kind", ["standard", "new_set", "refill"]);

/**
 * Extra opties met eigen bedrijfslogica:
 * - nail_art: prijs per nagel, extra tijd uit de instelling nailArtDefaultBufferMinutes
 * - removal_before_new_set: vaste prijs en duur, alleen vóór een nieuwe set
 */
export const optionKind = pgEnum("option_kind", ["nail_art", "removal_before_new_set"]);

/** Wat de klant in stap 2 kiest, bijvoorbeeld "BIAB" of "Omhoogplaatsen". */
export const treatments = pgTable(
  "treatments",
  {
    id: id(),
    slug: text().notNull().unique(),
    category: treatmentCategory().notNull(),
    name: text().notNull(),
    /** Korte uitleg in de reserveringsflow. */
    summary: text(),
    /**
     * false = niet zelf te kiezen in de openbare flow (nieuwe extensionsplaatsing:
     * alleen via een vrijgave van Jessie na het consult).
     */
    publiclyBookable: boolean().notNull().default(true),
    active: boolean().notNull().default(true),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (t) => [index().on(t.category, t.sortOrder)],
);

/**
 * Een boekbare variant met prijs en duur, bijvoorbeeld "BIAB met French ·
 * nieuwe set" of "50 cm · 2 banen".
 *
 * Een variant zonder prijs of duur is incompleet en niet online boekbaar.
 * We verzinnen geen waarden: Jessie vult ze aan in de admin.
 */
export const treatmentVariants = pgTable(
  "treatment_variants",
  {
    id: id(),
    treatmentId: uuid()
      .notNull()
      .references(() => treatments.id, { onDelete: "cascade" }),
    /** Rijlabel in de prijstabel, bijvoorbeeld "Acryl met gellak" of "2 banen". */
    label: text().notNull(),
    kind: variantKind().notNull().default("standard"),
    /** Extensions: lengte in centimeters. */
    lengthCm: smallint(),
    /** Extensions: aantal banen. */
    weftRows: smallint(),
    priceCents: integer(),
    durationMinutes: smallint(),
    /** Publieke toelichting, bijvoorbeeld "Neem contact op voor opvullen." */
    note: text(),
    active: boolean().notNull().default(true),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index().on(t.treatmentId, t.sortOrder),
    unique().on(t.treatmentId, t.label, t.kind, t.lengthCm, t.weftRows).nullsNotDistinct(),
    check("treatment_variants_price_check", sql`${t.priceCents} >= 0`),
    check("treatment_variants_duration_check", sql`${t.durationMinutes} > 0`),
    check("treatment_variants_weft_rows_check", sql`${t.weftRows} between 1 and 10`),
  ],
);

export const treatmentOptions = pgTable(
  "treatment_options",
  {
    id: id(),
    kind: optionKind().notNull().unique(),
    name: text().notNull(),
    /** nail_art: prijs per nagel. removal_before_new_set: vaste meerprijs. */
    priceCents: integer(),
    /**
     * Onbevestigde prijzen tonen we niet als definitief feit.
     * TODO(content): €15 verwijderen bij een nieuwe set bevestigen (PROJECT-TODOS.md).
     */
    priceConfirmed: boolean().notNull().default(true),
    /** Vaste extra tijd. Leeg bij nail art: die gebruikt de instelling. */
    durationMinutes: smallint(),
    active: boolean().notNull().default(true),
    sortOrder: smallint().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("treatment_options_price_check", sql`${t.priceCents} >= 0`),
    check("treatment_options_duration_check", sql`${t.durationMinutes} > 0`),
  ],
);

/**
 * Bij welke behandelingen een optie kan. `variantKind` leeg = alle varianten;
 * anders alleen dat soort (bijv. verwijderen alleen vóór een nieuwe set).
 */
export const treatmentOptionRules = pgTable(
  "treatment_option_rules",
  {
    id: id(),
    optionId: uuid()
      .notNull()
      .references(() => treatmentOptions.id, { onDelete: "cascade" }),
    treatmentId: uuid()
      .notNull()
      .references(() => treatments.id, { onDelete: "cascade" }),
    variantKind: variantKind(),
  },
  (t) => [unique().on(t.optionId, t.treatmentId, t.variantKind).nullsNotDistinct()],
);
