"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { parseEuroInput } from "@/lib/money";
import { optionalText, parseDateInput, parseMinutesInput, parseTimeInput } from "@/lib/input";
import { addDays, localDateString, zonedDateTimeToUtc } from "@/lib/time";
import {
  changeStatus,
  createAdminAppointment,
  reschedule,
  saveInternalNotes,
  type ChangeResult,
  type PlanResult,
} from "@/server/admin/appointments";
import { requireAdmin } from "@/server/auth/session";
import { createRelease, revokeRelease, setDepositPaid } from "@/server/booking/release";

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

const reload = "Er ging iets mis. Laad de pagina opnieuw.";

const messages: Record<Exclude<ChangeResult | PlanResult, { ok: true }>["reason"], string> = {
  "niet-gevonden": "Deze afspraak bestaat niet (meer).",
  "niet-toegestaan": "Dat kan niet (meer) bij deze afspraak. Laad de pagina opnieuw.",
  "tijd-bezet": "Deze tijd is inmiddels bezet door een andere afspraak of aanvraag. Bevestigen kan niet meer.",
  blokkade:
    "Dit tijdstip valt in een blokkade (bijvoorbeeld pauze of vakantie). Vink ‘Toch inplannen’ aan als je dat zeker weet.",
  bezet: "Op dit tijdstip staat al een andere afspraak of aanvraag. Kies een andere tijd.",
  "buiten-openingstijden":
    "Dit tijdstip valt (deels) buiten je openingstijden. Vink ‘Toch inplannen’ aan als je dat zeker weet.",
  "keuze-ongeldig": "Vul de duur in: voor deze behandeling is nog geen vaste duur bekend.",
};

const statusActions = z.enum(["confirm", "reject", "cancel", "complete", "no_show"]);

export async function changeStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  const action = statusActions.safeParse(formData.get("actie"));
  if (!id.success || !action.success) return { error: reload };

  const result = await changeStatus(id.data, action.data, optionalText(formData.get("note")));
  if (!result.ok) return { error: messages[result.reason] };
  // Het formulier van deze actie verdwijnt na de wijziging; de melding staat daarom op de pagina zelf.
  redirect(`/admin/afspraken/${id.data}?gedaan=${action.data}`);
}

/** Datum, tijd en duur uit het formulier; `null` als iets niet klopt. */
function readMoment(formData: FormData) {
  const date = parseDateInput(field(formData, "date"));
  const time = parseTimeInput(field(formData, "time"));
  const duration = parseMinutesInput(field(formData, "duration"));
  if (!date.ok || !time.ok || !duration.ok) return null;
  return { startAt: zonedDateTimeToUtc(date.value, time.value), durationMinutes: duration.value };
}

export async function rescheduleAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: reload };

  const moment = readMoment(formData);
  if (!moment || moment.durationMinutes === null) {
    return { error: "Vul een datum, een begintijd en de duur in minuten in." };
  }
  if (moment.startAt <= new Date()) return { error: "Dit tijdstip ligt in het verleden." };

  const result = await reschedule(id.data, {
    startAt: moment.startAt,
    durationMinutes: moment.durationMinutes,
    force: formData.get("force") === "on",
  });
  if (!result.ok) return { error: messages[result.reason] };
  refresh();
  return { success: "Verplaatst." };
}

export async function saveNotesAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: reload };
  await saveInternalNotes(id.data, optionalText(formData.get("notes"), 2000));
  refresh();
  return { success: "Opgeslagen." };
}

const customerSchema = z.object({
  name: z.string().trim().min(2, "Vul de naam van de klant in.").max(120),
  email: z.union([z.literal(""), z.email("Dit e-mailadres klopt niet. Laat het leeg als je het niet weet.")]),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{8,20}$/, "Vul een telefoonnummer in, bijvoorbeeld 06 12345678."),
});

export async function createAppointmentAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const variantId = z.uuid().safeParse(formData.get("variantId"));
  if (!variantId.success) return { error: "Kies een behandeling." };

  const moment = readMoment(formData);
  if (!moment) return { error: "Vul een datum en een begintijd in. De duur is een aantal minuten (of leeg)." };
  if (moment.startAt <= new Date()) return { error: "Dit tijdstip ligt in het verleden." };

  const price = parseEuroInput(field(formData, "price"));
  if (!price.ok) return { error: "De prijs klopt niet. Typ bijvoorbeeld 45 of 255,50, of laat het leeg." };

  const customer = customerSchema.safeParse({
    name: field(formData, "name"),
    email: field(formData, "email").trim(),
    phone: field(formData, "phone"),
  });
  if (!customer.success) return { error: customer.error.issues[0]?.message ?? reload };

  const result = await createAdminAppointment({
    variantId: variantId.data,
    startAt: moment.startAt,
    durationMinutes: moment.durationMinutes,
    priceCents: price.cents,
    name: customer.data.name,
    email: customer.data.email || null,
    phone: customer.data.phone,
    notes: optionalText(formData.get("notes"), 2000),
    force: formData.get("force") === "on",
  });
  if (!result.ok) return { error: messages[result.reason] };
  redirect(`/admin/afspraken/${result.id}`);
}

/** Basis-URL voor links naar de klant: SITE_URL, of het adres waarop het beheer nu draait. */
async function siteUrl(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function createReleaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const appointmentId = z.uuid().safeParse(formData.get("appointmentId"));
  const variantId = z.uuid().safeParse(formData.get("variantId"));
  if (!appointmentId.success) return { error: reload };
  if (!variantId.success) return { error: "Kies lengte en aantal banen." };

  const duration = parseMinutesInput(field(formData, "duration"));
  if (!duration.ok || duration.value === null) return { error: "Vul de duur van de plaatsing in minuten in." };
  const price = parseEuroInput(field(formData, "price"));
  const deposit = parseEuroInput(field(formData, "deposit"));
  if (!price.ok || !deposit.ok) return { error: "Een bedrag klopt niet. Typ bijvoorbeeld 430 of 255,50." };
  const validUntil = parseDateInput(field(formData, "validUntil"));
  if (!validUntil.ok || validUntil.value <= localDateString()) {
    return { error: "Kies tot wanneer de link werkt (vanaf morgen)." };
  }

  const result = await createRelease({
    appointmentId: appointmentId.data,
    variantId: variantId.data,
    priceCents: price.cents,
    durationMinutes: duration.value,
    colourNotes: optionalText(formData.get("colourNotes"), 1000),
    depositCents: deposit.cents,
    // De link werkt tot en met de gekozen dag.
    expiresAt: zonedDateTimeToUtc(addDays(validUntil.value, 1), "00:00"),
  });
  if (!result.ok) {
    return {
      error: result.reason === "prijs-onbekend" ? "Vul de prijs in; voor deze variant staat nog geen prijs." : reload,
    };
  }
  refresh();
  return {
    success: "Vrijgave gemaakt. Stuur de klant deze link, bijvoorbeeld via WhatsApp. Je ziet hem maar één keer.",
    copy: { label: "Link voor de klant", value: `${await siteUrl()}/reserveren/plaatsing/${result.token}` },
  };
}

export async function revokeReleaseAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("releaseId"));
  if (!id.success) return { error: reload };
  await revokeRelease(id.data);
  refresh();
  return { success: "Ingetrokken. De link werkt niet meer." };
}

export async function depositPaidAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("releaseId"));
  if (!id.success) return { error: reload };
  await setDepositPaid(id.data, formData.get("paid") === "ja");
  refresh();
  return { success: "Opgeslagen." };
}
