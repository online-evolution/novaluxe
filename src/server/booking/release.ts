import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { releaseState, releaseUsingStatuses } from "@/domain/release";
import { getDb } from "@/server/db";
import {
  appointmentEvents,
  appointments,
  customers,
  extensionReleases,
  treatments,
  treatmentVariants,
} from "@/server/db/schema";
import { hashToken, newToken } from "@/server/tokens";
import {
  isExclusionViolation,
  isPublicSlotFree,
  loadSettings,
  lockAndSweep,
  pendingExpiry,
  variantSnapshotLabel,
  type Db,
  type Tx,
} from "./core";

/*
 * Vrijgave voor een nieuwe extensionsplaatsing (na het gratis consult).
 * Jessie legt variant, prijs en duur vast; de klant krijgt een eenmalige
 * link en vraagt daarmee zelf een tijd aan. Ook dat blijft een aanvraag die
 * Jessie bevestigt. Het token staat alleen als hash in de database.
 */

// ---------- Beheer (alleen na requireAdmin) ----------

/** Varianten die alleen via een vrijgave te plannen zijn (nu: de nieuwe plaatsing). */
export async function listReleaseVariants(db: Db | Tx = getDb()) {
  return db
    .select({
      id: treatmentVariants.id,
      label: treatmentVariants.label,
      priceCents: treatmentVariants.priceCents,
      durationMinutes: treatmentVariants.durationMinutes,
      treatmentName: treatments.name,
    })
    .from(treatmentVariants)
    .innerJoin(treatments, eq(treatmentVariants.treatmentId, treatments.id))
    .where(
      and(
        eq(treatments.category, "extensions"),
        eq(treatments.publiclyBookable, false),
        eq(treatments.active, true),
        eq(treatmentVariants.active, true),
      ),
    )
    .orderBy(asc(treatments.sortOrder), asc(treatmentVariants.sortOrder));
}

/** Vrijgaven van een klant, met hun huidige stand. */
export async function listReleasesForCustomer(customerId: string) {
  const db = getDb();
  const releases = await db
    .select({ release: extensionReleases, variantLabel: treatmentVariants.label })
    .from(extensionReleases)
    .innerJoin(treatmentVariants, eq(extensionReleases.variantId, treatmentVariants.id))
    .where(eq(extensionReleases.customerId, customerId))
    .orderBy(desc(extensionReleases.createdAt));
  if (releases.length === 0) return [];

  const linked = await db
    .select({
      id: appointments.id,
      releaseId: appointments.releaseId,
      status: appointments.status,
      expiresAt: appointments.expiresAt,
      startAt: appointments.startAt,
    })
    .from(appointments)
    .where(inArray(appointments.releaseId, releases.map(({ release }) => release.id)))
    .orderBy(desc(appointments.createdAt));

  const now = new Date();
  return releases.map(({ release, variantLabel }) => {
    const own = linked.filter((item) => item.releaseId === release.id);
    return { ...release, variantLabel, state: releaseState(release, own, now), appointments: own };
  });
}

/**
 * Maakt een vrijgave voor de klant van `appointmentId` (meestal het consult).
 * Klant en variant worden hier gecontroleerd, niet uit het formulier
 * overgenomen. Het token wordt alleen nu teruggegeven.
 */
export async function createRelease(input: {
  appointmentId: string;
  variantId: string;
  priceCents: number | null;
  durationMinutes: number;
  colourNotes: string | null;
  depositCents: number | null;
  expiresAt: Date;
}): Promise<{ ok: true; token: string } | { ok: false; reason: "niet-gevonden" | "prijs-onbekend" }> {
  const db = getDb();
  const [appointment] = await db
    .select({ customerId: appointments.customerId })
    .from(appointments)
    .where(eq(appointments.id, input.appointmentId))
    .limit(1);
  const variant = (await listReleaseVariants(db)).find((item) => item.id === input.variantId);
  if (!appointment || !variant) return { ok: false, reason: "niet-gevonden" };
  const priceCents = input.priceCents ?? variant.priceCents;
  if (priceCents === null) return { ok: false, reason: "prijs-onbekend" };

  const token = newToken();
  await db.insert(extensionReleases).values({
    customerId: appointment.customerId,
    consultAppointmentId: input.appointmentId,
    variantId: variant.id,
    priceCents,
    durationMinutes: input.durationMinutes,
    colourNotes: input.colourNotes,
    depositCents: input.depositCents,
    expiresAt: input.expiresAt,
    tokenHash: hashToken(token),
  });
  return { ok: true, token };
}

export async function revokeRelease(id: string) {
  await getDb().update(extensionReleases).set({ revokedAt: new Date() }).where(eq(extensionReleases.id, id));
}

export async function setDepositPaid(id: string, paid: boolean) {
  await getDb()
    .update(extensionReleases)
    .set({ depositPaidAt: paid ? new Date() : null })
    .where(eq(extensionReleases.id, id));
}

// ---------- Klant (via de link) ----------

async function loadOpenRelease(token: string, db: Db | Tx) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [row] = await db
    .select({
      release: extensionReleases,
      variant: treatmentVariants,
      treatment: treatments,
      customerName: customers.name,
    })
    .from(extensionReleases)
    .innerJoin(treatmentVariants, eq(extensionReleases.variantId, treatmentVariants.id))
    .innerJoin(treatments, eq(treatmentVariants.treatmentId, treatments.id))
    .innerJoin(customers, eq(extensionReleases.customerId, customers.id))
    .where(eq(extensionReleases.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return null;

  const linked = await db
    .select({ status: appointments.status, expiresAt: appointments.expiresAt })
    .from(appointments)
    .where(and(eq(appointments.releaseId, row.release.id), inArray(appointments.status, [...releaseUsingStatuses])));
  return releaseState(row.release, linked, new Date()) === "open" ? row : null;
}

export type OpenRelease = {
  treatmentName: string;
  variantLabel: string;
  priceCents: number;
  durationMinutes: number;
  colourNotes: string | null;
  depositCents: number | null;
  depositPaid: boolean;
  expiresAt: Date;
  firstName: string;
};

/** Wat de klant op de vrijgavepagina ziet; `null` als de link niet (meer) werkt. */
export async function findOpenRelease(token: string): Promise<OpenRelease | null> {
  const row = await loadOpenRelease(token, getDb());
  if (!row) return null;
  return {
    treatmentName: row.treatment.name,
    variantLabel: row.variant.label,
    priceCents: row.release.priceCents,
    durationMinutes: row.release.durationMinutes,
    colourNotes: row.release.colourNotes,
    depositCents: row.release.depositCents,
    depositPaid: row.release.depositPaidAt !== null,
    expiresAt: row.release.expiresAt,
    firstName: row.customerName.split(/\s+/)[0] ?? row.customerName,
  };
}

export type ReleaseRequestResult =
  | { ok: true; appointmentId: string }
  | { ok: false; reason: "link-ongeldig" | "tijd-niet-beschikbaar" | "tijd-net-bezet" };

/** Aanvraag via de link: zelfde lock en controles als een gewone online aanvraag. */
export async function createReleaseRequest(input: {
  token: string;
  startAt: Date;
  notes: string | null;
}): Promise<ReleaseRequestResult> {
  try {
    return await getDb().transaction(async (tx) => {
      await lockAndSweep(tx);
      const row = await loadOpenRelease(input.token, tx);
      if (!row) return { ok: false, reason: "link-ongeldig" } as const;

      const settings = await loadSettings(tx);
      const { durationMinutes } = row.release;
      if (!(await isPublicSlotFree(tx, input.startAt, durationMinutes, settings))) {
        return { ok: false, reason: "tijd-niet-beschikbaar" } as const;
      }

      const [appointment] = await tx
        .insert(appointments)
        .values({
          customerId: row.release.customerId,
          treatmentId: row.treatment.id,
          variantId: row.variant.id,
          startAt: input.startAt,
          endAt: new Date(input.startAt.getTime() + durationMinutes * 60 * 1000),
          status: "pending",
          expiresAt: pendingExpiry(input.startAt, settings),
          source: "release",
          releaseId: row.release.id,
          treatmentName: row.treatment.name,
          variantLabel: variantSnapshotLabel(row.variant),
          priceCents: row.release.priceCents,
          durationMinutes,
          customerNotes: input.notes,
        })
        .returning({ id: appointments.id });
      await tx.insert(appointmentEvents).values({
        appointmentId: appointment!.id,
        fromStatus: null,
        toStatus: "pending",
        actor: "customer",
        note: "Aangevraagd via vrijgavelink",
      });
      return { ok: true, appointmentId: appointment!.id } as const;
    });
  } catch (error) {
    if (isExclusionViolation(error)) return { ok: false, reason: "tijd-net-bezet" };
    throw error;
  }
}
