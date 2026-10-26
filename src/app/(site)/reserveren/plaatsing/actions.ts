"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { site } from "@/config/site";
import { clientIp } from "@/server/auth/rate-limit";
import { createReleaseRequest } from "@/server/booking/release";
import { takeToken } from "@/server/rate-limit";

export type ReleaseBookingState = {
  error?: string;
  /** De gekozen tijd is weg: opnieuw kiezen uit verse tijden. */
  slotGone?: boolean;
};

const schema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  startAt: z.iso.datetime(),
  notes: z.string().trim().max(1000),
});

export async function requestReleaseAppointment(
  _previous: ReleaseBookingState,
  formData: FormData,
): Promise<ReleaseBookingState> {
  if (!(await takeToken("release-ip", await clientIp(), { limit: 10, windowMinutes: 60 }))) {
    return {
      error: `Er zijn vanaf dit apparaat veel aanvragen verstuurd. Probeer het later opnieuw of bel ${site.phone.display}.`,
    };
  }
  const parsed = schema.safeParse({
    token: formData.get("token"),
    startAt: formData.get("startAt"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return { error: "Kies eerst een datum en een tijd." };

  try {
    const result = await createReleaseRequest({
      token: parsed.data.token,
      startAt: new Date(parsed.data.startAt),
      notes: parsed.data.notes || null,
    });
    if (!result.ok) {
      if (result.reason === "link-ongeldig") {
        return { error: `Deze link werkt niet meer. Neem contact op met Jessie via ${site.phone.display}.` };
      }
      return { error: "Dit tijdstip is net niet meer beschikbaar. Kies een ander moment.", slotGone: true };
    }
  } catch (error) {
    // Geen details naar de bezoeker; wel in de serverlog (zonder persoonsgegevens of token).
    console.error("Aanvraag via vrijgavelink mislukt", error instanceof Error ? error.message : error);
    return { error: `Het versturen is niet gelukt. Probeer het nog eens, of bel ${site.phone.display}.` };
  }

  redirect("/reserveren/ontvangen");
}
