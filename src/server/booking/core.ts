import "server-only";
import { and, asc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { isSlotAvailable, openingRangesFor } from "@/domain/availability";
import type { VariantKind } from "@/domain/catalog";
import type { Weekday, WeeklyHours } from "@/domain/hours";
import { resolveSettings, type Settings } from "@/domain/settings";
import { utcToZonedParts, zonedDateTimeToUtc } from "@/lib/time";
import { getDb } from "@/server/db";
import { appointments, blockedPeriods, businessHours, customers, settings as settingsTable } from "@/server/db/schema";
import { loadBusy, loadExceptions, rulesFrom } from "./availability";

/*
 * Bouwstenen voor elke transactie die een tijd in de agenda vastlegt: een
 * online aanvraag, bevestigen, verplaatsen, een afspraak die Jessie zelf
 * invoert en een aanvraag via een vrijgavelink. Allemaal binnen dezelfde
 * advisory lock, zodat ze elkaar niet kunnen passeren.
 */

export type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const BOOKING_LOCK = 742_001; // vaste sleutel: één salon, één agenda

const minute = 60 * 1000;
const day = 24 * 60 * minute;

/** Lock nemen en verlopen aanvragen vrijgeven (met een regel in het logboek). */
export async function lockAndSweep(tx: Tx) {
  await tx.execute(sql`select pg_advisory_xact_lock(${BOOKING_LOCK})`);
  await tx.execute(sql`
    with expired as (
      update appointments set status = 'expired', updated_at = now()
      where status = 'pending' and expires_at <= now()
      returning id
    )
    insert into appointment_events (appointment_id, from_status, to_status, actor, note)
    select id, 'pending', 'expired', 'system', 'Niet op tijd bevestigd' from expired
  `);
}

export async function loadSettings(tx: Tx): Promise<Settings> {
  return resolveSettings(await tx.select().from(settingsTable));
}

async function loadWeeklyHours(tx: Tx): Promise<WeeklyHours> {
  const rows = await tx.select().from(businessHours).orderBy(asc(businessHours.weekday), asc(businessHours.opensAt));
  const week: WeeklyHours = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const row of rows) {
    week[row.weekday as Weekday].push({ opensAt: row.opensAt.slice(0, 5), closesAt: row.closesAt.slice(0, 5) });
  }
  return week;
}

/**
 * Voor klanten: ligt `startAt` op een vrij tijdslot volgens alle regels
 * (openingstijden, bezetting, minimale aanvraagtijd, weken vooruit)?
 */
export async function isPublicSlotFree(
  tx: Tx,
  startAt: Date,
  durationMinutes: number,
  settings: Settings,
): Promise<boolean> {
  const date = utcToZonedParts(startAt).date;
  const [weekly, exceptions, busy] = await Promise.all([
    loadWeeklyHours(tx),
    loadExceptions(date, date, tx),
    loadBusy(new Date(startAt.getTime() - day), new Date(startAt.getTime() + day), tx),
  ]);
  return isSlotAvailable(startAt, {
    date,
    durationMinutes,
    ranges: openingRangesFor(date, weekly, exceptions),
    busy,
    now: new Date(),
    rules: rulesFrom(settings),
  });
}

export type AdminSlotCheck = "vrij" | "bezet" | "blokkade" | "buiten-openingstijden";

/**
 * Voor Jessie: zij mag buiten de klantregels plannen (ook op korte termijn),
 * maar nooit over een andere afspraak heen. Een blokkade of een tijd buiten
 * de openingstijden meldt deze controle, zodat het beheer om bevestiging kan
 * vragen. `ignoreAppointmentId`: de afspraak die zelf verplaatst wordt.
 */
export async function checkAdminSlot(
  tx: Tx,
  startAt: Date,
  endAt: Date,
  ignoreAppointmentId?: string,
): Promise<AdminSlotCheck> {
  const now = new Date();
  const taken = await tx
    .select({ id: appointments.id, status: appointments.status, expiresAt: appointments.expiresAt })
    .from(appointments)
    .where(
      and(
        lt(appointments.startAt, endAt),
        gt(appointments.endAt, startAt),
        inArray(appointments.status, ["pending", "confirmed"]),
      ),
    );
  const clash = taken.some(
    (row) =>
      row.id !== ignoreAppointmentId &&
      (row.status === "confirmed" || (row.expiresAt !== null && row.expiresAt > now)),
  );
  if (clash) return "bezet";

  const blocks = await tx
    .select({ start: blockedPeriods.startAt, end: blockedPeriods.endAt })
    .from(blockedPeriods)
    .where(and(lt(blockedPeriods.startAt, endAt), gt(blockedPeriods.endAt, startAt)));
  if (blocks.length > 0) return "blokkade";

  const date = utcToZonedParts(startAt).date;
  const [weekly, exceptions] = await Promise.all([loadWeeklyHours(tx), loadExceptions(date, date, tx)]);
  const inside = openingRangesFor(date, weekly, exceptions).some(
    (range) =>
      zonedDateTimeToUtc(date, range.opensAt) <= startAt && endAt <= zonedDateTimeToUtc(date, range.closesAt),
  );
  return inside ? "vrij" : "buiten-openingstijden";
}

/** Eén klant per e-mailadres; zonder e-mailadres (telefonisch) altijd een nieuwe klant. */
export async function findOrCreateCustomer(
  tx: Tx,
  input: { name: string; email: string | null; phone: string },
): Promise<string> {
  const email = input.email?.trim().toLowerCase() || null;
  if (email) {
    const [existing] = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(sql`lower(${customers.email}) = ${email}`)
      .limit(1);
    if (existing) {
      await tx.update(customers).set({ name: input.name, phone: input.phone }).where(eq(customers.id, existing.id));
      return existing.id;
    }
  }
  const [created] = await tx
    .insert(customers)
    .values({ name: input.name, email, phone: input.phone })
    .returning({ id: customers.id });
  return created!.id;
}

const kindLabels: Record<VariantKind, string> = { standard: "", new_set: "Nieuwe set", refill: "Opvullen" };

/** Variantnaam zoals die bij de afspraak wordt vastgelegd, bijv. "Lang · Nieuwe set". */
export function variantSnapshotLabel(variant: { label: string; kind: VariantKind }): string {
  return [variant.label, kindLabels[variant.kind]].filter(Boolean).join(" · ");
}

/** Hoe lang een nieuwe aanvraag het tijdslot vasthoudt: nooit voorbij het begin. */
export function pendingExpiry(startAt: Date, settings: Settings, now = new Date()): Date {
  const holdUntil = new Date(now.getTime() + settings.pendingHoldHours * 60 * minute);
  return holdUntil < startAt ? holdUntil : startAt;
}

/** Postgres weigerde overlap (exclusion constraint), bijv. bij een gelijktijdige aanvraag. */
export function isExclusionViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    if (typeof current === "object" && current !== null && "code" in current && current.code === "23P01") {
      return true;
    }
    current = typeof current === "object" && current !== null && "cause" in current ? current.cause : undefined;
  }
  return false;
}
