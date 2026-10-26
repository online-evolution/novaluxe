import "server-only";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";

/*
 * Opslag voor openbare bestanden (foto's op de website). De rest van de app
 * kent alleen deze interface, zodat een andere provider later alleen hier
 * hoeft te worden aangesloten.
 *   - Vercel Blob als BLOB_READ_WRITE_TOKEN is ingesteld (productie).
 *   - Anders, alleen tijdens ontwikkeling: een map in public/uploads.
 */

export type StoredFile = { key: string; url: string };

export type PublicStorage = {
  put(key: string, body: Buffer, contentType: string): Promise<StoredFile>;
  remove(file: StoredFile): Promise<void>;
};

const blobStorage: PublicStorage = {
  async put(key, body, contentType) {
    const result = await put(key, body, { access: "public", contentType, addRandomSuffix: false });
    return { key, url: result.url };
  },
  async remove(file) {
    await del(file.url);
  },
};

const localRoot = path.join(process.cwd(), "public", "uploads");

const localStorage: PublicStorage = {
  async put(key, body) {
    const target = path.join(localRoot, key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return { key, url: `/uploads/${key}` };
  },
  async remove(file) {
    await rm(path.join(localRoot, file.key), { force: true });
  },
};

/** `null`: er is (nog) geen opslag ingesteld, uploaden kan dan niet. */
export function getPublicStorage(): PublicStorage | null {
  if (process.env.BLOB_READ_WRITE_TOKEN) return blobStorage;
  if (process.env.NODE_ENV !== "production") return localStorage;
  return null;
}
