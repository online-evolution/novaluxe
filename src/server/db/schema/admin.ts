import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamptz, timestamps } from "./columns";

/** Beheerders. Eén primaire beheerder (Jessie), maar meer accounts zijn mogelijk. */
export const adminUsers = pgTable(
  "admin_users",
  {
    id: id(),
    email: text().notNull(),
    name: text().notNull(),
    /** scrypt-hash met parameters en salt (src/server/auth/password.ts). */
    passwordHash: text().notNull(),
    active: boolean().notNull().default(true),
    lastLoginAt: timestamptz(),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_unique").on(sql`lower(${t.email})`)],
);

/**
 * Inlogsessies. Het id is de SHA-256-hash van het token in de cookie; het
 * token zelf staat nergens opgeslagen.
 */
export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: text().primaryKey(),
    adminUserId: uuid()
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    expiresAt: timestamptz().notNull(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.adminUserId), index().on(t.expiresAt)],
);

export const authAttemptScope = pgEnum("auth_attempt_scope", ["email", "ip"]);

/**
 * Inlogpogingen voor rate limiting. E-mailadres en IP staan alleen als
 * HMAC-hash opgeslagen, niet leesbaar.
 */
export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: id(),
    scope: authAttemptScope().notNull(),
    keyHash: text().notNull(),
    success: boolean().notNull(),
    createdAt: timestamptz().notNull().defaultNow(),
  },
  (t) => [index().on(t.scope, t.keyHash, t.createdAt)],
);
