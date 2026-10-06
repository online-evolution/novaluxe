import "server-only";
import { sql } from "drizzle-orm";
import { resolveSettings, settingKeys, type Settings } from "@/domain/settings";
import { getDb } from "@/server/db";
import { settings } from "@/server/db/schema";

/* Beheer van boekingsregels. Alleen aanroepen na requireAdmin(). */

/** Altijd vers uit de database (niet de publieke cache). */
export async function getSettingsForAdmin(): Promise<Settings> {
  return resolveSettings(await getDb().select().from(settings));
}

export async function saveSettings(values: Settings) {
  await getDb().transaction(async (tx) => {
    for (const key of settingKeys) {
      const value = values[key] ?? sql`'null'::jsonb`;
      await tx
        .insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
    }
  });
}
