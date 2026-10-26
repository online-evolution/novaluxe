"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { parseEuroInput } from "@/lib/money";
import { optionalText, parseDateInput, parseMinutesInput, parseTimeInput } from "@/lib/input";
import { zonedDateTimeToUtc } from "@/lib/time";
import {
  changeStatus,
  createAdminAppointment,
  reschedule,
  saveInternalNotes,
  type ChangeResult,
  type PlanResult,
} from "@/server/admin/appointments";
import { requireAdmin } from "@/server/auth/session";

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
