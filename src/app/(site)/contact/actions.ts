"use server";

import { after } from "next/server";
import { z } from "zod";
import { site } from "@/config/site";
import { clientIp } from "@/server/auth/rate-limit";
import { saveContactMessage } from "@/server/contact";
import { sendMailNow } from "@/server/mail/service";
import { takeToken } from "@/server/rate-limit";

export type ContactField = "name" | "email" | "phone" | "message";

export type ContactState = {
  sent?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<ContactField, string>>;
};

const schema = z.object({
  name: z.string().trim().min(2, "Vul je naam in.").max(120),
  email: z.string().min(1, "Vul je e-mailadres in, zodat ik je kan antwoorden.").pipe(z.email("Vul een geldig e-mailadres in.").max(200)),
  phone: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^[0-9+()\-\s]{8,20}$/, "Vul een telefoonnummer in, bijvoorbeeld 06 12345678."),
  ]),
  message: z.string().trim().min(5, "Schrijf je vraag of bericht.").max(2000, "Je bericht is te lang."),
});

/** Minimale tijd tussen openen en versturen; sneller is vrijwel altijd een bot. */
const minimumFillSeconds = 4;
/** Meer links dan dit in één bericht is vrijwel altijd spam. */
const maxLinks = 2;
const linkPattern = /https?:\/\/|www\./gi;

export async function sendContactMessage(_previous: ContactState, formData: FormData): Promise<ContactState> {
  // Spam: een verborgen veld en een tijdcontrole. Bots krijgen dezelfde
  // bedanktekst, zodat ze niets leren.
  const startedAt = Number(formData.get("startedAt"));
  const tooFast = !Number.isFinite(startedAt) || Date.now() - startedAt < minimumFillSeconds * 1000;
  if (String(formData.get("website") ?? "") !== "" || tooFast) return { sent: true };

  const parsed = schema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    message: String(formData.get("message") ?? ""),
  });

  const fieldErrors: ContactState["fieldErrors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "phone" || field === "message") {
        fieldErrors[field] ??= issue.message;
      }
    }
  }
  if (!parsed.success || Object.keys(fieldErrors).length > 0) {
    return { error: "Controleer de gemarkeerde velden.", fieldErrors };
  }

  // Spam met links krijgt ook de bedanktekst, maar wordt niet opgeslagen.
  if ((parsed.data.message.match(linkPattern)?.length ?? 0) > maxLinks) return { sent: true };

  // Per apparaat, en een dagelijks maximum voor alle berichten samen: spam
  // vanaf veel adressen tegelijk kan de lijst van Jessie zo niet vullen.
  const busy = `Er zijn veel berichten verstuurd. Probeer het later opnieuw of bel ${site.phone.display}.`;
  if (!(await takeToken("contact-ip", await clientIp(), { limit: 5, windowMinutes: 60 }))) return { error: busy };
  if (!(await takeToken("contact-all", "all", { limit: 50, windowMinutes: 24 * 60 }))) return { error: busy };

  try {
    const contactMessageId = await saveContactMessage({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message,
    });
    // Melding aan Jessie, na het antwoord aan de bezoeker.
    after(() => sendMailNow("bericht", { contactMessageId }));
  } catch (error) {
    // Geen details naar de bezoeker; wel in de serverlog (zonder persoonsgegevens).
    console.error("Contactbericht opslaan mislukt", error instanceof Error ? error.message : error);
    return { error: `Het versturen is niet gelukt. Probeer het nog eens, of bel ${site.phone.display}.` };
  }

  return { sent: true };
}
