import "server-only";
import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import sharp from "sharp";
import { getDb } from "@/server/db";
import { images } from "@/server/db/schema";
import { getPublicStorage } from "@/server/storage";

/*
 * Foto's uit het beheer verwerken voordat ze online komen:
 *   - controleren dat het echt een afbeelding is (niet alleen de extensie);
 *   - rechtop zetten volgens de camera-oriëntatie;
 *   - verkleinen tot maximaal 2000 px aan de lange kant;
 *   - alle metadata verwijderen, zoals de GPS-locatie van een telefoonfoto.
 * De browser verkleint al vóór het versturen; dit is de controle aan de serverkant.
 */

/** Grootste bestand dat de server accepteert (de browser stuurt normaal ±0,5 MB). */
export const maxUploadBytes = 3.5 * 1024 * 1024;
const maxEdge = 2000;
const minShortEdge = 600;

export type ImageError = "geen-bestand" | "te-groot" | "geen-foto" | "te-klein" | "geen-opslag";

export const imageErrorMessages: Record<ImageError, string> = {
  "geen-bestand": "Kies een foto.",
  "te-groot": "Deze foto is te groot. Probeer het opnieuw, of stuur een kleinere versie.",
  "geen-foto": "Dit bestand kan niet als foto worden gebruikt. Gebruik een JPG- of PNG-foto.",
  "te-klein": "Deze foto is te klein voor de website. Gebruik de originele foto, niet een schermafbeelding.",
  "geen-opslag": "Het opslaan van foto's is nog niet ingesteld. Neem contact op met de bouwer van de website.",
};

export type SavedImage = { id: string; key: string; url: string };

/** Verwerkt en bewaart een foto; geeft de id in de tabel `images` terug. */
export async function saveImage(
  file: FormDataEntryValue | null,
): Promise<{ ok: true; image: SavedImage } | { ok: false; error: ImageError }> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "geen-bestand" };
  if (file.size > maxUploadBytes) return { ok: false, error: "te-groot" };
  const storage = getPublicStorage();
  if (!storage) return { ok: false, error: "geen-opslag" };

  let output: { data: Buffer; info: { width: number; height: number } };
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), { failOn: "error", limitInputPixels: 50_000_000 });
    const meta = await input.metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) return { ok: false, error: "geen-foto" };
    output = await input
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, error: "geen-foto" };
  }
  if (Math.min(output.info.width, output.info.height) < minShortEdge) return { ok: false, error: "te-klein" };

  const stored = await storage.put(`fotos/${randomUUID()}.jpg`, output.data, "image/jpeg");
  const [row] = await getDb()
    .insert(images)
    .values({
      storageKey: stored.key,
      url: stored.url,
      width: output.info.width,
      height: output.info.height,
      bytes: output.data.length,
    })
    .returning({ id: images.id });
  return { ok: true, image: { id: row!.id, ...stored } };
}

/**
 * Verwijdert foto's uit de database en de opslag. Alleen aanroepen als
 * niets er nog naar verwijst. Een mislukte verwijdering in de opslag laat de
 * website heel (het bestand blijft dan alleen ongebruikt staan) en wordt gelogd.
 */
export async function removeImages(ids: string[]) {
  if (ids.length === 0) return;
  const rows = await getDb().delete(images).where(inArray(images.id, ids)).returning();
  const storage = getPublicStorage();
  for (const row of rows) {
    try {
      await storage?.remove({ key: row.storageKey, url: row.url });
    } catch (error) {
      console.error("Foto verwijderen uit opslag mislukt", row.storageKey, error instanceof Error ? error.message : error);
    }
  }
}
