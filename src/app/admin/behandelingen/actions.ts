"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { parseMinutesInput } from "@/lib/input";
import { parseEuroInput } from "@/lib/money";
import { saveOptions, saveTreatment, type OptionUpdate, type VariantUpdate } from "@/server/admin/catalog";
import { requireAdmin } from "@/server/auth/session";
import { cacheTags } from "@/server/cache-tags";

const uuid = z.uuid();

const saved: ActionState = { success: "Opgeslagen. De website is bijgewerkt." };

export async function saveTreatmentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const treatmentId = uuid.safeParse(formData.get("treatmentId"));
  if (!treatmentId.success) return { error: "Er ging iets mis. Laad de pagina opnieuw." };

  const problems: string[] = [];
  const variants: VariantUpdate[] = [];
  for (const rawId of formData.getAll("variantId")) {
    const id = uuid.safeParse(rawId);
    if (!id.success) continue;
    const label = String(formData.get(`${id.data}.label`) ?? "");
    const price = parseEuroInput(String(formData.get(`${id.data}.price`) ?? ""));
    const duration = parseMinutesInput(String(formData.get(`${id.data}.duration`) ?? ""));
    if (!price.ok) problems.push(`de prijs bij ${label}`);
    if (!duration.ok) problems.push(`de duur bij ${label}`);
    if (price.ok && duration.ok) {
      variants.push({
        id: id.data,
        priceCents: price.cents,
        durationMinutes: duration.value,
        active: formData.get(`${id.data}.active`) === "on",
      });
    }
  }

  if (problems.length > 0) {
    return {
      error: `Controleer ${problems.slice(0, 3).join(", ")}${problems.length > 3 ? " en meer" : ""}. Prijs bijvoorbeeld 55 of 255,50; duur in hele minuten (5–600).`,
    };
  }

  await saveTreatment({
    treatmentId: treatmentId.data,
    active: formData.get("active") === "on",
    variants,
  });
  updateTag(cacheTags.catalog);
  return saved;
}

export async function saveOptionsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const problems: string[] = [];
  const updates: OptionUpdate[] = [];
  for (const rawId of formData.getAll("optionId")) {
    const id = uuid.safeParse(rawId);
    if (!id.success) continue;
    const label = String(formData.get(`${id.data}.label`) ?? "");
    const price = parseEuroInput(String(formData.get(`${id.data}.price`) ?? ""));
    const durationField = formData.get(`${id.data}.duration`);
    const duration =
      durationField === null ? ({ ok: true, value: null } as const) : parseMinutesInput(String(durationField));
    if (!price.ok) problems.push(`de prijs bij ${label}`);
    if (!duration.ok) problems.push(`de duur bij ${label}`);
    if (price.ok && duration.ok) {
      updates.push({
        id: id.data,
        priceCents: price.cents,
        durationMinutes: duration.value,
        priceConfirmed: formData.get(`${id.data}.confirmed`) === "on",
        active: formData.get(`${id.data}.active`) === "on",
      });
    }
  }

  if (problems.length > 0) return { error: `Controleer ${problems.join(" en ")}.` };

  await saveOptions(updates);
  updateTag(cacheTags.catalog);
  return saved;
}
