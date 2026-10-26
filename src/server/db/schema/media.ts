import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
import { treatmentCategory } from "./catalog";
import { id, timestamptz, timestamps } from "./columns";

/*
 * Foto's op de website. Het bestand zelf staat in de opslag (zie
 * src/server/storage); hier staan alleen de verwijzing en de afmetingen.
 */

export const images = pgTable("images", {
  id: id(),
  /** Sleutel in de opslag, om het bestand later te kunnen verwijderen. */
  storageKey: text().notNull().unique(),
  url: text().notNull(),
  width: smallint().notNull(),
  height: smallint().notNull(),
  bytes: integer().notNull(),
  createdAt: timestamptz().notNull().defaultNow(),
});

/** Welk deel van de foto zichtbaar blijft als de plek een andere verhouding heeft. */
export const photoFocus = pgEnum("photo_focus", ["top", "center", "bottom"]);

/**
 * Vaste plekken op de website, aangeduid met de shotcode uit
 * PHOTO-SHOTLIST.md (bijv. "J01"). Zonder rij toont de site de placeholder.
 */
export const sitePhotos = pgTable("site_photos", {
  shot: text().primaryKey(),
  imageId: uuid()
    .notNull()
    .references(() => images.id, { onDelete: "restrict" }),
  alt: text(),
  focus: photoFocus().notNull().default("center"),
  updatedAt: timestamptz()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const galleryKind = pgEnum("gallery_kind", ["photo", "before_after"]);

/** Werk van Jessie: losse foto's en voor-en-na-paren. */
export const galleryItems = pgTable(
  "gallery_items",
  {
    id: id(),
    kind: galleryKind().notNull(),
    /** De foto, of bij voor en na: het resultaat ("na"). */
    imageId: uuid()
      .notNull()
      .references(() => images.id, { onDelete: "restrict" }),
    beforeImageId: uuid().references(() => images.id, { onDelete: "restrict" }),
    category: treatmentCategory(),
    caption: text(),
    alt: text(),
    focus: photoFocus().notNull().default("center"),
    published: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index().on(t.kind, t.published, t.sortOrder),
    check(
      "gallery_items_before_check",
      sql`(${t.kind} = 'before_after') = (${t.beforeImageId} is not null)`,
    ),
  ],
);
