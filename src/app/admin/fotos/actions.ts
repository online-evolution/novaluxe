"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { photoShotCodes } from "@/config/photo-shots";
import { optionalText } from "@/lib/input";
import {
  addGalleryItem,
  clearSitePhoto,
  deleteGalleryItem,
  moveGalleryItem,
  setSitePhoto,
  updateGalleryItem,
  updateSitePhotoDetails,
} from "@/server/admin/photos";
import { requireAdmin } from "@/server/auth/session";
import { cacheTags } from "@/server/cache-tags";
import { imageErrorMessages, removeImages, saveImage } from "@/server/images";

const reload = "Er ging iets mis. Laad de pagina opnieuw.";
const focusSchema = z.enum(["top", "center", "bottom"]).catch("center");
const categorySchema = z.enum(["nails", "extensions"]).nullable().catch(null);
const shotSchema = z.string().refine((code) => photoShotCodes.has(code));

function done(message: string): ActionState {
  updateTag(cacheTags.photos);
  return { success: message };
}

// ---------- Vaste plekken ----------

export async function setSitePhotoAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const shot = shotSchema.safeParse(formData.get("shot"));
  if (!shot.success) return { error: reload };

  const saved = await saveImage(formData.get("photo"));
  if (!saved.ok) return { error: imageErrorMessages[saved.error] };
  const previous = await setSitePhoto({
    shot: shot.data,
    imageId: saved.image.id,
    alt: optionalText(formData.get("alt"), 300),
    focus: focusSchema.parse(formData.get("focus")),
  });
  if (previous) await removeImages([previous]);
  return done("Geplaatst. De foto staat nu op de website.");
}

export async function updateSitePhotoAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const shot = shotSchema.safeParse(formData.get("shot"));
  if (!shot.success) return { error: reload };
  await updateSitePhotoDetails(shot.data, {
    alt: optionalText(formData.get("alt"), 300),
    focus: focusSchema.parse(formData.get("focus")),
  });
  return done("Opgeslagen.");
}

export async function clearSitePhotoAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const shot = shotSchema.safeParse(formData.get("shot"));
  if (!shot.success) return { error: reload };
  const previous = await clearSitePhoto(shot.data);
  if (previous) await removeImages([previous]);
  return done("Verwijderd. Op die plek staat weer de lege fotoplek.");
}

// ---------- Werk en voor en na ----------

export async function addPhotoAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const saved = await saveImage(formData.get("photo"));
  if (!saved.ok) return { error: imageErrorMessages[saved.error] };
  await addGalleryItem({
    kind: "photo",
    imageId: saved.image.id,
    beforeImageId: null,
    category: categorySchema.parse(formData.get("category") || null),
    caption: optionalText(formData.get("caption"), 120),
    alt: optionalText(formData.get("alt"), 300),
    focus: focusSchema.parse(formData.get("focus")),
  });
  return done("Toegevoegd. De foto staat vooraan bij je werk.");
}

export async function addBeforeAfterAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const before = await saveImage(formData.get("before"));
  if (!before.ok) return { error: `Voor-foto: ${imageErrorMessages[before.error]}` };
  const after = await saveImage(formData.get("after"));
  if (!after.ok) {
    await removeImages([before.image.id]);
    return { error: `Na-foto: ${imageErrorMessages[after.error]}` };
  }
  await addGalleryItem({
    kind: "before_after",
    imageId: after.image.id,
    beforeImageId: before.image.id,
    category: categorySchema.parse(formData.get("category") || null),
    caption: optionalText(formData.get("caption"), 120),
    alt: optionalText(formData.get("alt"), 300),
    focus: focusSchema.parse(formData.get("focus")),
  });
  return done("Toegevoegd. Het voor en na staat vooraan.");
}

export async function updateGalleryItemAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: reload };
  await updateGalleryItem(id.data, {
    caption: optionalText(formData.get("caption"), 120),
    alt: optionalText(formData.get("alt"), 300),
    focus: focusSchema.parse(formData.get("focus")),
    category: categorySchema.parse(formData.get("category") || null),
    published: formData.get("published") === "on",
  });
  return done("Opgeslagen.");
}

export async function moveGalleryItemAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  const direction = z.enum(["up", "down"]).safeParse(formData.get("direction"));
  if (!id.success || !direction.success) return { error: reload };
  await moveGalleryItem(id.data, direction.data);
  return done("Verplaatst.");
}

export async function deleteGalleryItemAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: reload };
  await removeImages(await deleteGalleryItem(id.data));
  return done("Verwijderd.");
}
