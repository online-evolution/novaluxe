"use server";

import { updateTag } from "next/cache";
import type { ActionState } from "@/components/admin/action-form";
import { settingsSchema } from "@/domain/settings";
import { saveSettings } from "@/server/admin/settings";
import { requireAdmin } from "@/server/auth/session";
import { cacheTags } from "@/server/cache-tags";

const number = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  return text === "" ? null : /^\d+$/.test(text) ? Number(text) : Number.NaN;
};

export async function saveSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    slotIntervalMinutes: number(formData.get("slotIntervalMinutes")),
    minLeadTimeHours: number(formData.get("minLeadTimeHours")),
    maxAdvanceWeeks: number(formData.get("maxAdvanceWeeks")),
    mustFinishBeforeClosing: formData.get("mustFinishBeforeClosing") === "on",
    pendingHoldHours: number(formData.get("pendingHoldHours")),
    nailArtDefaultBufferMinutes: number(formData.get("nailArtDefaultBufferMinutes")),
    attachmentRetentionDays: number(formData.get("attachmentRetentionDays")),
  });

  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const labels: Record<string, string> = {
      slotIntervalMinutes: "de tijdstappen",
      minLeadTimeHours: "hoe ver van tevoren (uren, 0–168)",
      maxAdvanceWeeks: "hoe ver vooruit (weken, 1–52)",
      pendingHoldHours: "hoe lang een aanvraag het tijdstip vasthoudt (uren, 1–168)",
      nailArtDefaultBufferMinutes: "de extra tijd voor nail art (minuten, 0–240)",
      attachmentRetentionDays: "de bewaartermijn van voorbeeldfoto's (dagen, 1–365)",
    };
    return { error: `Controleer ${labels[field] ?? "de ingevulde waarden"}.` };
  }

  await saveSettings(parsed.data);
  updateTag(cacheTags.settings);
  return { success: "Opgeslagen." };
}
