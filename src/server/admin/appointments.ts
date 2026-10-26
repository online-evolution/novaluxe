import "server-only";
import { and, asc, desc, eq, gt, gte, inArray, lt, lte, or } from "drizzle-orm";
import { actionTargets, allowedActions, type AdminAction } from "@/domain/appointment";
import { addDays, formatMoment, zonedDateTimeToUtc } from "@/lib/time";
import { getDb } from "@/server/db";
import {
  appointmentEvents,
  appointmentOptions,
  appointments,
  customers,
  extensionReleases,
  treatments,
  treatmentVariants,
} from "@/server/db/schema";
import {
  checkAdminSlot,
  findOrCreateCustomer,
  isExclusionViolation,
  lockAndSweep,
  variantSnapshotLabel,
  type AdminSlotCheck,
} from "@/server/booking/core";

/*
 * Afsprakenbeheer voor Jessie. Alleen aanroepen na requireAdmin(); de
 * serveracties in src/app/admin regelen dat. Alles wat een tijd vastlegt of
 * verschuift, loopt via dezelfde lock als de online aanvragen.
 */

const listColumns = {
  id: appointments.id,
  startAt: appointments.startAt,
  endAt: appointments.endAt,
  status: appointments.status,
  expiresAt: appointments.expiresAt,
  source: appointments.source,
  treatmentName: appointments.treatmentName,
  variantLabel: appointments.variantLabel,
  nailArtRequested: appointments.nailArtRequested,
  customerName: customers.name,
  createdAt: appointments.createdAt,
};

export type AppointmentListItem = Awaited<ReturnType<typeof listForDay>>[number];

/** Alles wat op een dag in de agenda staat (geen afgewezen, geannuleerde of verlopen). */
export async function listForDay(date: string) {
  const from = zonedDateTimeToUtc(date, "00:00");
  const to = zonedDateTimeToUtc(addDays(date, 1), "00:00");
  return getDb()
    .select(listColumns)
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(
      and(
        gte(appointments.startAt, from),
        lt(appointments.startAt, to),
        or(
          inArray(appointments.status, ["confirmed", "completed", "no_show"]),
          and(eq(appointments.status, "pending"), gt(appointments.expiresAt, new Date())),
        ),
      ),
    )
    .orderBy(asc(appointments.startAt));
}

/**
 * Aanvragen die op Jessie wachten, plus verlopen aanvragen waarvan de tijd
 * nog komt (die kan ze alsnog bevestigen).
 */
export async function listRequests() {
  const now = new Date();
  return getDb()
    .select(listColumns)
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(and(inArray(appointments.status, ["pending", "expired"]), gt(appointments.startAt, now)))
    .orderBy(asc(appointments.startAt));
}

export async function listUpcoming() {
  return getDb()
    .select(listColumns)
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(and(eq(appointments.status, "confirmed"), gt(appointments.endAt, new Date())))
    .orderBy(asc(appointments.startAt));
}

/** Voorbij, of definitief afgehandeld; de nieuwste eerst. */
export async function listPast(limit = 100) {
  const now = new Date();
  return getDb()
    .select(listColumns)
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .where(
      or(
        lte(appointments.startAt, now),
        inArray(appointments.status, ["rejected", "cancelled", "completed", "no_show"]),
      ),
    )
    .orderBy(desc(appointments.startAt))
    .limit(limit);
}

export async function getAppointmentForAdmin(id: string) {
  const db = getDb();
  const [row] = await db
    .select({ appointment: appointments, customer: customers, category: treatments.category })
    .from(appointments)
    .innerJoin(customers, eq(appointments.customerId, customers.id))
    .innerJoin(treatments, eq(appointments.treatmentId, treatments.id))
    .where(eq(appointments.id, id))
    .limit(1);
  if (!row) return null;

  const [options, events, history] = await Promise.all([
    db.select().from(appointmentOptions).where(eq(appointmentOptions.appointmentId, id)),
    db
      .select()
      .from(appointmentEvents)
      .where(eq(appointmentEvents.appointmentId, id))
      .orderBy(asc(appointmentEvents.createdAt)),
    db
      .select({ id: appointments.id, startAt: appointments.startAt, status: appointments.status, treatmentName: appointments.treatmentName })
      .from(appointments)
      .where(eq(appointments.customerId, row.customer.id))
      .orderBy(desc(appointments.startAt))
      .limit(12),
  ]);

  return { ...row, options, events, history: history.filter((item) => item.id !== id) };
}

export type ChangeResult =
  | { ok: true }
  | { ok: false; reason: "niet-gevonden" | "niet-toegestaan" | "tijd-bezet" | "blokkade" };

/** Bevestigen, afwijzen, annuleren, geweest of niet gekomen. */
export async function changeStatus(
  id: string,
  action: Exclude<AdminAction, "reschedule">,
  note: string | null,
): Promise<ChangeResult> {
  try {
    return await getDb().transaction(async (tx) => {
      await lockAndSweep(tx);
      const [current] = await tx.select().from(appointments).where(eq(appointments.id, id)).for("update").limit(1);
      if (!current) return { ok: false, reason: "niet-gevonden" } as const;
      if (!allowedActions(current, new Date()).includes(action)) {
        return { ok: false, reason: "niet-toegestaan" } as const;
      }

      const target = actionTargets[action];
      if (action === "confirm" && current.status === "expired") {
        // De tijd was vrijgegeven; controleer of hij dat nog steeds is.
        const check = await checkAdminSlot(tx, current.startAt, current.endAt, current.id);
        if (check === "bezet") return { ok: false, reason: "tijd-bezet" } as const;
        if (check === "blokkade") return { ok: false, reason: "blokkade" } as const;
      }

      await tx
        .update(appointments)
        .set({
          status: target,
          expiresAt: null,
          decidedAt: current.status === "pending" || current.status === "expired" ? new Date() : current.decidedAt,
        })
        .where(eq(appointments.id, id));
      await tx.insert(appointmentEvents).values({
        appointmentId: id,
        fromStatus: current.status,
        toStatus: target,
        actor: "admin",
        note,
      });
      if (target === "confirmed" && current.releaseId) {
        // De vrijgavelink heeft nu zijn doel bereikt.
        await tx.update(extensionReleases).set({ usedAt: new Date() }).where(eq(extensionReleases.id, current.releaseId));
      }
      // Fase 13: bij 'confirmed' hier de bevestigingsmail inplannen.
      return { ok: true } as const;
    });
  } catch (error) {
    if (isExclusionViolation(error)) return { ok: false, reason: "tijd-bezet" };
    throw error;
  }
}

export type PlanResult =
  | { ok: true; id: string }
  | { ok: false; reason: "niet-gevonden" | "niet-toegestaan" | "keuze-ongeldig" | Exclude<AdminSlotCheck, "vrij"> };

/**
 * Verplaatsen van een bevestigde afspraak. Een tijd buiten de openingstijden
 * of over een blokkade kan alleen met `force` (Jessie heeft dat bevestigd);
 * over een andere afspraak heen kan nooit.
 */
export async function reschedule(
  id: string,
  input: { startAt: Date; durationMinutes: number; force: boolean },
): Promise<PlanResult> {
  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60 * 1000);
  try {
    return await getDb().transaction(async (tx) => {
      await lockAndSweep(tx);
      const [current] = await tx.select().from(appointments).where(eq(appointments.id, id)).for("update").limit(1);
      if (!current) return { ok: false, reason: "niet-gevonden" } as const;
      if (!allowedActions(current, new Date()).includes("reschedule")) {
        return { ok: false, reason: "niet-toegestaan" } as const;
      }

      const check = await checkAdminSlot(tx, input.startAt, endAt, id);
      if (check === "bezet" || (check !== "vrij" && !input.force)) return { ok: false, reason: check } as const;

      await tx
        .update(appointments)
        .set({ startAt: input.startAt, endAt, durationMinutes: input.durationMinutes })
        .where(eq(appointments.id, id));
      await tx.insert(appointmentEvents).values({
        appointmentId: id,
        fromStatus: current.status,
        toStatus: current.status,
        actor: "admin",
        note: `Verplaatst (was ${formatMoment(current.startAt)})`,
      });
      return { ok: true, id } as const;
    });
  } catch (error) {
    if (isExclusionViolation(error)) return { ok: false, reason: "bezet" };
    throw error;
  }
}

export async function saveInternalNotes(id: string, notes: string | null) {
  await getDb().update(appointments).set({ internalNotes: notes }).where(eq(appointments.id, id));
}

/** Varianten waaruit Jessie kiest bij het zelf invoeren, ook niet-openbare (bijv. nieuwe plaatsing). */
export async function listVariantsForPlanning() {
  return getDb()
    .select({
      id: treatmentVariants.id,
      label: treatmentVariants.label,
      kind: treatmentVariants.kind,
      priceCents: treatmentVariants.priceCents,
      durationMinutes: treatmentVariants.durationMinutes,
      treatmentName: treatments.name,
      category: treatments.category,
    })
    .from(treatmentVariants)
    .innerJoin(treatments, eq(treatmentVariants.treatmentId, treatments.id))
    .where(and(eq(treatmentVariants.active, true), eq(treatments.active, true)))
    .orderBy(asc(treatments.sortOrder), asc(treatmentVariants.sortOrder));
}

/** Een afspraak die Jessie zelf invoert, bijvoorbeeld telefonisch gemaakt. Direct bevestigd. */
export async function createAdminAppointment(input: {
  variantId: string;
  startAt: Date;
  durationMinutes: number | null;
  priceCents: number | null;
  name: string;
  email: string | null;
  phone: string;
  notes: string | null;
  force: boolean;
}): Promise<PlanResult> {
  try {
    return await getDb().transaction(async (tx) => {
      await lockAndSweep(tx);
      const [row] = await tx
        .select({ variant: treatmentVariants, treatment: treatments })
        .from(treatmentVariants)
        .innerJoin(treatments, eq(treatmentVariants.treatmentId, treatments.id))
        .where(eq(treatmentVariants.id, input.variantId))
        .limit(1);
      const durationMinutes = input.durationMinutes ?? row?.variant.durationMinutes ?? null;
      if (!row || durationMinutes === null) return { ok: false, reason: "keuze-ongeldig" } as const;

      const endAt = new Date(input.startAt.getTime() + durationMinutes * 60 * 1000);
      const check = await checkAdminSlot(tx, input.startAt, endAt);
      if (check === "bezet" || (check !== "vrij" && !input.force)) return { ok: false, reason: check } as const;

      const customerId = await findOrCreateCustomer(tx, input);
      const [created] = await tx
        .insert(appointments)
        .values({
          customerId,
          treatmentId: row.treatment.id,
          variantId: row.variant.id,
          startAt: input.startAt,
          endAt,
          status: "confirmed",
          source: "admin",
          treatmentName: row.treatment.name,
          variantLabel: variantSnapshotLabel(row.variant),
          priceCents: input.priceCents ?? row.variant.priceCents,
          durationMinutes,
          internalNotes: input.notes,
          decidedAt: new Date(),
        })
        .returning({ id: appointments.id });
      await tx.insert(appointmentEvents).values({
        appointmentId: created!.id,
        fromStatus: null,
        toStatus: "confirmed",
        actor: "admin",
        note: "Zelf ingevoerd",
      });
      return { ok: true, id: created!.id } as const;
    });
  } catch (error) {
    if (isExclusionViolation(error)) return { ok: false, reason: "bezet" };
    throw error;
  }
}

/** Telt open aanvragen, voor het menu en de startpagina. */
export async function countOpenRequests(): Promise<number> {
  const rows = await getDb()
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.status, "pending"), gt(appointments.expiresAt, new Date())));
  return rows.length;
}
