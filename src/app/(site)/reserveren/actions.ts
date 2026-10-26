"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { site } from "@/config/site";
import { clientIp } from "@/server/auth/rate-limit";
import { createAppointmentRequest } from "@/server/booking/request";
import { takeToken } from "@/server/rate-limit";

export type BookingField = "name" | "email" | "phone" | "nailArtDescription";

export type BookingState = {
  error?: string;
  fieldErrors?: Partial<Record<BookingField, string>>;
  /** De gekozen tijd is weg: terug naar datum en tijd, opnieuw laden. */
  slotGone?: boolean;
};

const schema = z.object({
  variantId: z.uuid(),
  optionIds: z.array(z.uuid()).max(5),
  nailArt: z.boolean(),
  nailArtDescription: z.string().trim().max(1000),
  startAt: z.iso.datetime(),
  name: z.string().trim().min(2, "Vul je naam in.").max(120),
  email: z.email("Vul een geldig e-mailadres in.").max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{8,20}$/, "Vul een telefoonnummer in, bijvoorbeeld 06 12345678."),
  notes: z.string().trim().max(1000),
});

/** Minimale tijd tussen openen en versturen; sneller is vrijwel altijd een bot. */
const minimumFillSeconds = 4;

export async function requestAppointment(
  _previous: BookingState,
  formData: FormData,
): Promise<BookingState> {
  // Spam: een verborgen veld dat mensen niet zien, en een tijdcontrole.
  // Bots krijgen dezelfde bevestigingspagina, zodat ze niets leren.
  const startedAt = Number(formData.get("startedAt"));
  const tooFast = !Number.isFinite(startedAt) || Date.now() - startedAt < minimumFillSeconds * 1000;
  if (String(formData.get("website") ?? "") !== "" || tooFast) {
    redirect("/reserveren/ontvangen");
  }

  if (!(await takeToken("booking-ip", await clientIp(), { limit: 5, windowMinutes: 60 }))) {
    return {
      error: `Er zijn vanaf dit apparaat veel aanvragen verstuurd. Probeer het over een uur opnieuw of bel ${site.phone.display}.`,
    };
  }

  const nailArt = formData.get("nailArt") === "ja";
  const parsed = schema.safeParse({
    variantId: formData.get("variantId"),
    optionIds: formData.getAll("optionId"),
    nailArt,
    nailArtDescription: String(formData.get("nailArtDescription") ?? ""),
    startAt: formData.get("startAt"),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  const fieldErrors: BookingState["fieldErrors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "phone") fieldErrors[field] ??= issue.message;
    }
  }
  if (nailArt && String(formData.get("nailArtDescription") ?? "").trim().length < 3) {
    fieldErrors.nailArtDescription = "Beschrijf kort welke nail art je wilt.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Controleer de gemarkeerde velden.", fieldErrors };
  }
  if (!parsed.success) {
    return { error: "Er ontbreekt iets in je aanvraag. Ga een stap terug en kies opnieuw." };
  }

  try {
    const result = await createAppointmentRequest({
      ...parsed.data,
      startAt: new Date(parsed.data.startAt),
      nailArtDescription: parsed.data.nailArtDescription || null,
      notes: parsed.data.notes || null,
    });
    if (!result.ok) {
      if (result.reason === "keuze-ongeldig") {
        return {
          error: `Deze behandeling is op dit moment niet online aan te vragen. Kies opnieuw of bel ${site.phone.display}.`,
        };
      }
      return {
        error: "Dit tijdstip is net niet meer beschikbaar. Kies een ander moment.",
        slotGone: true,
      };
    }
  } catch (error) {
    // Geen details naar de bezoeker; wel in de serverlog (zonder persoonsgegevens).
    console.error("Afspraakaanvraag mislukt", error instanceof Error ? error.message : error);
    return {
      error: `Het versturen is niet gelukt. Probeer het nog eens, of bel ${site.phone.display}.`,
    };
  }

  redirect("/reserveren/ontvangen");
}
