import "server-only";
import { count, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/server/db";
import { contactMessages } from "@/server/db/schema";

/*
 * Berichten via het contactformulier: opslaan (openbaar, na controle in de
 * actie) en lezen, markeren en verwijderen (alleen in het beheer).
 */

export type ContactMessage = typeof contactMessages.$inferSelect;

export async function saveContactMessage(input: {
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
}): Promise<string> {
  const [row] = await getDb().insert(contactMessages).values(input).returning({ id: contactMessages.id });
  return row!.id;
}

/** Ongelezen berichten eerst, daarbinnen de nieuwste bovenaan. */
export async function listContactMessages(): Promise<ContactMessage[]> {
  return getDb()
    .select()
    .from(contactMessages)
    .orderBy(sql`(${contactMessages.readAt} is null) desc`, desc(contactMessages.createdAt));
}

export async function countUnreadMessages(): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(contactMessages)
    .where(isNull(contactMessages.readAt));
  return row?.total ?? 0;
}

export async function setMessageRead(id: string, read: boolean): Promise<void> {
  await getDb()
    .update(contactMessages)
    .set({ readAt: read ? new Date() : null })
    .where(eq(contactMessages.id, id));
}

export async function deleteContactMessage(id: string): Promise<void> {
  await getDb().delete(contactMessages).where(eq(contactMessages.id, id));
}
