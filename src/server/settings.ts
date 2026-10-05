import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { resolveSettings, type Settings } from "@/domain/settings";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import { settings } from "./db/schema";

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(cacheTags.settings);
  cacheLife("max");

  const rows = await getDb().select().from(settings);
  return resolveSettings(rows);
}
