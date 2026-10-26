import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { galleryItems, images, sitePhotos } from "@/server/db/schema";
import { beforeImages, type PhotoFocus } from "@/server/photos";

/*
 * Beheer van foto's: vaste plekken en het werk. Alleen aanroepen na
 * requireAdmin(). Functies die een foto loskoppelen geven de id terug, zodat
 * de serveractie het bestand kan opruimen (removeImages).
 */

export async function listSitePhotosForAdmin() {
  return getDb()
    .select({
      shot: sitePhotos.shot,
      imageId: sitePhotos.imageId,
      alt: sitePhotos.alt,
      focus: sitePhotos.focus,
      url: images.url,
      width: images.width,
      height: images.height,
    })
    .from(sitePhotos)
    .innerJoin(images, eq(sitePhotos.imageId, images.id));
}

export async function listGalleryForAdmin() {
  return getDb()
    .select({
      item: galleryItems,
      url: images.url,
      width: images.width,
      height: images.height,
      beforeUrl: beforeImages.url,
      beforeWidth: beforeImages.width,
      beforeHeight: beforeImages.height,
    })
    .from(galleryItems)
    .innerJoin(images, eq(galleryItems.imageId, images.id))
    .leftJoin(beforeImages, eq(galleryItems.beforeImageId, beforeImages.id))
    .orderBy(asc(galleryItems.kind), asc(galleryItems.sortOrder), desc(galleryItems.createdAt));
}

/** Zet een foto op een vaste plek; geeft de id van de vorige foto terug (om op te ruimen). */
export async function setSitePhoto(input: { shot: string; imageId: string; alt: string | null; focus: PhotoFocus }) {
  return getDb().transaction(async (tx) => {
    const [previous] = await tx.select({ imageId: sitePhotos.imageId }).from(sitePhotos).where(eq(sitePhotos.shot, input.shot));
    await tx
      .insert(sitePhotos)
      .values(input)
      .onConflictDoUpdate({ target: sitePhotos.shot, set: { imageId: input.imageId, alt: input.alt, focus: input.focus } });
    return previous?.imageId ?? null;
  });
}

export async function updateSitePhotoDetails(shot: string, details: { alt: string | null; focus: PhotoFocus }) {
  await getDb().update(sitePhotos).set(details).where(eq(sitePhotos.shot, shot));
}

/** Haalt een foto van een vaste plek; geeft de id terug om op te ruimen. */
export async function clearSitePhoto(shot: string) {
  const [row] = await getDb().delete(sitePhotos).where(eq(sitePhotos.shot, shot)).returning({ imageId: sitePhotos.imageId });
  return row?.imageId ?? null;
}

export async function addGalleryItem(input: {
  kind: "photo" | "before_after";
  imageId: string;
  beforeImageId: string | null;
  category: "nails" | "extensions" | null;
  caption: string | null;
  alt: string | null;
  focus: PhotoFocus;
}) {
  // Nieuw werk komt vooraan.
  const [first] = await getDb()
    .select({ sortOrder: galleryItems.sortOrder })
    .from(galleryItems)
    .where(eq(galleryItems.kind, input.kind))
    .orderBy(asc(galleryItems.sortOrder))
    .limit(1);
  await getDb().insert(galleryItems).values({ ...input, sortOrder: (first?.sortOrder ?? 1) - 1 });
}

export async function updateGalleryItem(
  id: string,
  details: { caption: string | null; alt: string | null; focus: PhotoFocus; category: "nails" | "extensions" | null; published: boolean },
) {
  await getDb().update(galleryItems).set(details).where(eq(galleryItems.id, id));
}

/** Eén plek naar voren of naar achteren schuiven binnen hetzelfde soort werk. */
export async function moveGalleryItem(id: string, direction: "up" | "down") {
  await getDb().transaction(async (tx) => {
    const [current] = await tx.select().from(galleryItems).where(eq(galleryItems.id, id));
    if (!current) return;
    const siblings = await tx
      .select({ id: galleryItems.id })
      .from(galleryItems)
      .where(eq(galleryItems.kind, current.kind))
      .orderBy(asc(galleryItems.sortOrder), desc(galleryItems.createdAt));
    const index = siblings.findIndex((item) => item.id === id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= siblings.length) return;
    [siblings[index], siblings[target]] = [siblings[target]!, siblings[index]!];
    // Volgorde opnieuw nummeren, zodat gelijke waarden geen rol meer spelen.
    for (const [position, item] of siblings.entries()) {
      await tx.update(galleryItems).set({ sortOrder: position }).where(eq(galleryItems.id, item.id));
    }
  });
}

/** Verwijdert werk; geeft de foto-id's terug om op te ruimen. */
export async function deleteGalleryItem(id: string): Promise<string[]> {
  const [row] = await getDb()
    .delete(galleryItems)
    .where(eq(galleryItems.id, id))
    .returning({ imageId: galleryItems.imageId, beforeImageId: galleryItems.beforeImageId });
  return row ? [row.imageId, ...(row.beforeImageId ? [row.beforeImageId] : [])] : [];
}
