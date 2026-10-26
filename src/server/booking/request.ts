import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { isSlotAvailable, openingRangesFor } from "@/domain/availability";
import { quote, validateChoice } from "@/domain/booking";
import type { CatalogTreatment } from "@/domain/catalog";
import type { Weekday, WeeklyHours } from "@/domain/hours";
import { resolveSettings } from "@/domain/settings";
import { utcToZonedParts } from "@/lib/time";
import { getDb } from "@/server/db";
import {
  appointmentEvents,
  appointmentOptions,
  appointments,
  businessHours,
  customers,
  settings as settingsTable,
  treatmentOptionRules,
  treatmentOptions,
  treatments,
  treatmentVariants,
} from "@/server/db/schema";
import { loadBusy, loadExceptions, rulesFrom } from "./availability";

/*
 * Een afspraakaanvraag opslaan. Alles gebeurt in één transactie met een
 * advisory lock, zodat twee gelijktijdige aanvragen elkaar niet kunnen
 * passeren:
 *   1. verlopen aanvragen op 'expired' zetten (hun tijd komt vrij);
 *   2. keuze, prijs en duur opnieuw uit de database halen en controleren;
 *   3. de gekozen tijd opnieuw tegen de beschikbaarheid toetsen;
 *   4. klant opslaan (één per e-mailadres) en de aanvraag als 'pending'.
 * Als laatste vangnet weigert de database overlap (exclusion constraint).
 */

export type RequestInput = {
  variantId: string;
  optionIds: string[];
  nailArt: boolean;
  nailArtDescription: string | null;
  startAt: Date;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
};

export type RequestResult =
  | { ok: true; appointmentId: string }
  | { ok: false; reason: "keuze-ongeldig" | "tijd-niet-beschikbaar" | "tijd-net-bezet" };

const BOOKING_LOCK = 742_001; // vaste sleutel: één salon, één agenda

const kindLabels = { standard: "", new_set: "Nieuwe set", refill: "Opvullen" } as const;

export async function createAppointmentRequest(input: RequestInput): Promise<RequestResult> {
  try {
    return await getDb().transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${BOOKING_LOCK})`);

      // 1. Verlopen aanvragen vrijgeven, met een regel in het logboek.
      await tx.execute(sql`
        with expired as (
          update appointments set status = 'expired', updated_at = now()
          where status = 'pending' and expires_at <= now()
          returning id
        )
        insert into appointment_events (appointment_id, from_status, to_status, actor, note)
        select id, 'pending', 'expired', 'system', 'Niet op tijd bevestigd' from expired
      `);

      // 2. Keuze vers uit de database.
      const [row] = await tx
        .select({ variant: treatmentVariants, treatment: treatments })
        .from(treatmentVariants)
        .innerJoin(treatments, eq(treatmentVariants.treatmentId, treatments.id))
        .where(
          and(
            eq(treatmentVariants.id, input.variantId),
            eq(treatmentVariants.active, true),
            eq(treatments.active, true),
          ),
        )
        .limit(1);
      if (!row) return { ok: false, reason: "keuze-ongeldig" } as const;

      const optionRows = await tx
        .select({ option: treatmentOptions, variantKind: treatmentOptionRules.variantKind })
        .from(treatmentOptionRules)
        .innerJoin(treatmentOptions, eq(treatmentOptionRules.optionId, treatmentOptions.id))
        .where(and(eq(treatmentOptionRules.treatmentId, row.treatment.id), eq(treatmentOptions.active, true)));

      const treatment: CatalogTreatment = {
        ...row.treatment,
        variants: [row.variant],
        options: optionRows.map(({ option, variantKind }) => ({ ...option, variantKind })),
      };
      const checked = validateChoice({
        treatment,
        variant: row.variant,
        optionIds: input.optionIds,
        nailArt: input.nailArt,
      });
      if (!checked.ok) return { ok: false, reason: "keuze-ongeldig" } as const;

      const settings = resolveSettings(await tx.select().from(settingsTable));
      const { durationMinutes, priceCents } = quote(checked.choice, settings.nailArtDefaultBufferMinutes);

      // 3. Tijd opnieuw toetsen, met verse openingstijden, afwijkingen en bezetting.
      const now = new Date();
      const date = utcToZonedParts(input.startAt).date;
      const weekly = await loadWeeklyHours(tx);
      const exceptions = await loadExceptions(date, date, tx);
      const dayStart = new Date(input.startAt.getTime() - 24 * 60 * 60 * 1000);
      const dayEnd = new Date(input.startAt.getTime() + 24 * 60 * 60 * 1000);
      const busy = await loadBusy(dayStart, dayEnd, tx);
      const available = isSlotAvailable(input.startAt, {
        date,
        durationMinutes,
        ranges: openingRangesFor(date, weekly, exceptions),
        busy,
        now,
        rules: rulesFrom(settings),
      });
      if (!available) return { ok: false, reason: "tijd-niet-beschikbaar" } as const;

      // 4. Klant (één per e-mailadres) en aanvraag.
      const email = input.email.trim().toLowerCase();
      const [existing] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(sql`lower(${customers.email}) = ${email}`)
        .limit(1);
      let customerId: string;
      if (existing) {
        customerId = existing.id;
        await tx.update(customers).set({ name: input.name, phone: input.phone }).where(eq(customers.id, customerId));
      } else {
        const [created] = await tx
          .insert(customers)
          .values({ name: input.name, email, phone: input.phone })
          .returning({ id: customers.id });
        customerId = created!.id;
      }

      const endAt = new Date(input.startAt.getTime() + durationMinutes * 60 * 1000);
      const holdUntil = new Date(now.getTime() + settings.pendingHoldHours * 60 * 60 * 1000);
      const expiresAt = holdUntil < input.startAt ? holdUntil : input.startAt;

      const [appointment] = await tx
        .insert(appointments)
        .values({
          customerId,
          treatmentId: row.treatment.id,
          variantId: row.variant.id,
          startAt: input.startAt,
          endAt,
          status: "pending",
          expiresAt,
          source: "online",
          treatmentName: row.treatment.name,
          variantLabel: [row.variant.label, kindLabels[row.variant.kind]].filter(Boolean).join(" · "),
          priceCents,
          durationMinutes,
          nailArtRequested: input.nailArt,
          nailArtDescription: input.nailArt ? input.nailArtDescription : null,
          customerNotes: input.notes,
        })
        .returning({ id: appointments.id });

      const chosen = checked.choice.options;
      const nailArtOption = treatment.options.find((option) => option.kind === "nail_art");
      const optionSnapshots = [
        ...chosen.map((option) => ({
          appointmentId: appointment!.id,
          optionId: option.id,
          name: option.name,
          priceCents: option.priceConfirmed ? option.priceCents : null,
          durationMinutes: option.durationMinutes ?? 0,
        })),
        ...(input.nailArt && nailArtOption
          ? [
              {
                appointmentId: appointment!.id,
                optionId: nailArtOption.id,
                name: nailArtOption.name,
                priceCents: null, // per nagel, afgestemd met Jessie
                durationMinutes: settings.nailArtDefaultBufferMinutes,
              },
            ]
          : []),
      ];
      if (optionSnapshots.length > 0) await tx.insert(appointmentOptions).values(optionSnapshots);

      await tx.insert(appointmentEvents).values({
        appointmentId: appointment!.id,
        fromStatus: null,
        toStatus: "pending",
        actor: "customer",
        note: "Online aangevraagd",
      });

      return { ok: true, appointmentId: appointment!.id } as const;
    });
  } catch (error) {
    // Laatste vangnet: de database weigert overlap (gelijktijdige aanvraag).
    if (isExclusionViolation(error)) return { ok: false, reason: "tijd-net-bezet" };
    throw error;
  }
}

async function loadWeeklyHours(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0]) {
  const rows = await tx.select().from(businessHours).orderBy(asc(businessHours.weekday), asc(businessHours.opensAt));
  const week: WeeklyHours = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
  for (const row of rows) {
    week[row.weekday as Weekday].push({ opensAt: row.opensAt.slice(0, 5), closesAt: row.closesAt.slice(0, 5) });
  }
  return week;
}

function isExclusionViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    if (typeof current === "object" && current !== null && "code" in current && current.code === "23P01") {
      return true;
    }
    current = typeof current === "object" && current !== null && "cause" in current ? current.cause : undefined;
  }
  return false;
}
