import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Tijd-geordende UUID's (Postgres 18 `uuidv7()`): beter voor indexen dan v4. */
export const id = () => uuid().primaryKey().default(sql`uuidv7()`);

/** Altijd `timestamptz`: eenduidig in UTC opgeslagen, rond zomertijd veilig. */
export const timestamptz = () => timestamp({ withTimezone: true, mode: "date" });

export const timestamps = {
  createdAt: timestamptz().notNull().defaultNow(),
  updatedAt: timestamptz()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
