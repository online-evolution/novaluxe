import "server-only";
import { asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import { galleryItems, images, sitePhotos } from "./db/schema";

/*
 * Foto's voor de openbare site. Gecachet; het beheer ververst de cache na
 * elke wijziging (updateTag).
 */

import type { PhotoFocus } from "@/components/media/focus";

export type { PhotoFocus };

export type WebPhoto = {
  url: string;
  width: number;
  height: number;
  alt: string | null;
  focus: PhotoFocus;
};

/** Foto's op vaste plekken, per shotcode. */
export async function getSitePhotos(): Promise<Record<string, WebPhoto>> {
  "use cache";
  cacheTag(cacheTags.photos);
  cacheLife("max");

  const rows = await getDb()
    .select({
      shot: sitePhotos.shot,
      alt: sitePhotos.alt,
      focus: sitePhotos.focus,
      url: images.url,
      width: images.width,
      height: images.height,
    })
    .from(sitePhotos)
    .innerJoin(images, eq(sitePhotos.imageId, images.id));
  return Object.fromEntries(rows.map(({ shot, ...photo }) => [shot, photo]));
}

export type GalleryPhoto = WebPhoto & { id: string; caption: string | null };
export type BeforeAfterPair = GalleryPhoto & { before: Pick<WebPhoto, "url" | "width" | "height"> };

export const beforeImages = alias(images, "before_images");

/** Gepubliceerd werk: losse foto's en voor-en-na-paren, in Jessies volgorde. */
export async function getGallery(): Promise<{ photos: GalleryPhoto[]; pairs: BeforeAfterPair[] }> {
  "use cache";
  cacheTag(cacheTags.photos);
  cacheLife("max");

  const rows = await getDb()
    .select({
      id: galleryItems.id,
      kind: galleryItems.kind,
      caption: galleryItems.caption,
      alt: galleryItems.alt,
      focus: galleryItems.focus,
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
    .where(eq(galleryItems.published, true))
    .orderBy(asc(galleryItems.sortOrder), desc(galleryItems.createdAt));

  const photos: GalleryPhoto[] = [];
  const pairs: BeforeAfterPair[] = [];
  for (const { kind, beforeUrl, beforeWidth, beforeHeight, ...item } of rows) {
    if (kind === "before_after" && beforeUrl && beforeWidth && beforeHeight) {
      pairs.push({ ...item, before: { url: beforeUrl, width: beforeWidth, height: beforeHeight } });
    } else if (kind === "photo") {
      photos.push(item);
    }
  }
  return { photos, pairs };
}
