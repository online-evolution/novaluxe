"use server";

import { refresh } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import type { ActionState } from "@/components/admin/action-form";
import { changeStatus, reschedule } from "@/server/admin/appointments";
import { clientIp } from "@/server/auth/rate-limit";
import { requireAdmin } from "@/server/auth/session";
import {
  acceptRemoteTimes,
  connectCalendar,
  disconnectCalendar,
  forgetLink,
  listDrifts,
  restoreEvent,
  saveBusyCalendars,
  syncCalendar,
} from "@/server/calendar/sync";
import { runIcloudSpike, type SpikeReport } from "@/server/icloud-spike";
import { takeToken } from "@/server/rate-limit";

const reload = "Er ging iets mis. Laad de pagina opnieuw.";

const credentials = z.object({
  username: z.email("Vul het Apple ID in (een e-mailadres)."),
  // Apple toont het als vier groepjes van vier letters met streepjes.
  password: z
    .string()
    .transform((value) => value.trim().toLowerCase().replace(/[\s-]/g, ""))
    .refine((value) => /^[a-z]{16}$/.test(value), "Vul het app-specifieke wachtwoord in, zoals abcd-efgh-ijkl-mnop.")
    .transform((value) => value.match(/.{4}/g)!.join("-")),
});

function readCredentials(formData: FormData) {
  return credentials.safeParse({
    username: String(formData.get("username") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
}

/** Koppelen. Het wachtwoord wordt alleen versleuteld opgeslagen en nooit teruggestuurd. */
export async function connectAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = readCredentials(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? reload };
  if (!(await takeToken("icloud-koppelen", await clientIp(), { limit: 10, windowMinutes: 60 }))) {
    return { error: "Je hebt het vaak geprobeerd. Probeer het over een uur opnieuw." };
  }

  const result = await connectCalendar(parsed.data.username, parsed.data.password);
  if (!result.ok) return { error: result.message };
  after(() => syncCalendar().catch(() => undefined));
  refresh();
  return { success: "Gekoppeld. De eerste synchronisatie loopt nu op de achtergrond." };
}

export async function syncNowAction(): Promise<ActionState> {
  await requireAdmin();
  const result = await syncCalendar();
  refresh();
  return result.ok ? { success: result.message } : { error: result.message };
}

export async function saveBusyAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const urls = z.array(z.url()).max(50).safeParse(formData.getAll("agenda"));
  if (!urls.success) return { error: reload };
  await saveBusyCalendars(urls.data);
  after(() => syncCalendar().catch(() => undefined));
  refresh();
  return { success: "Opgeslagen. De bezette tijden worden nu bijgewerkt." };
}

export async function disconnectAction(): Promise<ActionState> {
  await requireAdmin();
  await disconnectCalendar();
  refresh();
  return { success: "Ontkoppeld." };
}

const minute = 60 * 1000;

/** Een afwijking op de iPhone oplossen: de iPhone volgen, terugzetten of de afspraak annuleren. */
export async function resolveDriftAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  const choice = z.enum(["iphone", "terug", "annuleren"]).safeParse(formData.get("keuze"));
  if (!id.success || !choice.success) return { error: reload };

  const drift = (await listDrifts()).find((item) => item.appointmentId === id.data);
  if (!drift) {
    refresh();
    return { success: "Deze afwijking is al opgelost." };
  }

  if (choice.data === "terug") {
    const result = await restoreEvent(id.data);
    refresh();
    return result.ok ? { success: result.message } : { error: result.message };
  }

  if (choice.data === "annuleren") {
    if (drift.drift !== "verwijderd") return { error: reload };
    const result = await changeStatus(id.data, "cancel", "Verwijderd in de iPhone-agenda");
    if (!result.ok) return { error: "Annuleren is niet gelukt. Open de afspraak en probeer het daar." };
    await forgetLink(id.data);
    refresh();
    return { success: "De afspraak is geannuleerd. Laat het de klant zelf weten." };
  }

  // De tijd van de iPhone overnemen; nooit over een andere afspraak heen.
  if (drift.drift !== "verplaatst" || !drift.remoteStartAt || !drift.remoteEndAt) return { error: reload };
  const durationMinutes = Math.round((drift.remoteEndAt.getTime() - drift.remoteStartAt.getTime()) / minute);
  const result = await reschedule(id.data, { startAt: drift.remoteStartAt, durationMinutes, force: true });
  if (!result.ok) {
    return {
      error:
        result.reason === "bezet"
          ? "Op die tijd staat al een andere afspraak. Zet het agenda-item terug of verplaats de afspraak zelf."
          : "Overnemen is niet gelukt. Open de afspraak en verplaats hem daar.",
    };
  }
  await acceptRemoteTimes(id.data);
  refresh();
  return { success: "De afspraak staat nu op de tijd van de iPhone. Laat het de klant zelf weten." };
}

export type IcloudTestState = {
  error?: string;
  report?: SpikeReport;
};

/**
 * Draait de iCloud-spike met de ingevulde gegevens. Er wordt niets
 * opgeslagen: de gegevens bestaan alleen tijdens deze aanvraag en komen
 * nooit in een log of in het antwoord.
 */
export async function testIcloudAction(_previous: IcloudTestState, formData: FormData): Promise<IcloudTestState> {
  await requireAdmin();
  const parsed = readCredentials(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Controleer de gegevens." };

  if (!(await takeToken("icloud-test", await clientIp(), { limit: 10, windowMinutes: 60 }))) {
    return { error: "Je hebt de test vaak gedraaid. Probeer het over een uur opnieuw." };
  }

  const report = await runIcloudSpike({
    username: parsed.data.username,
    password: parsed.data.password,
    readOnly: formData.get("alleenLezen") === "ja",
  });
  return { report };
}
