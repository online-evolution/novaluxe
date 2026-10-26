import "server-only";
import { and, eq } from "drizzle-orm";
import { quote, validateChoice } from "@/domain/booking";
import type { CatalogTreatment } from "@/domain/catalog";
import { getDb } from "@/server/db";
import {
  appointmentEvents,
  appointmentOptions,
  appointments,
  treatmentOptionRules,
  treatmentOptions,
  treatments,
  treatmentVariants,
} from "@/server/db/schema";
import {
  findOrCreateCustomer,
  isExclusionViolation,
  isPublicSlotFree,
  loadSettings,
  lockAndSweep,
  pendingExpiry,
  variantSnapshotLabel,
} from "./core";

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

export async function createAppointmentRequest(input: RequestInput): Promise<RequestResult> {
  try {
    return await getDb().transaction(async (tx) => {
      // 1. Lock en verlopen aanvragen vrijgeven.
      await lockAndSweep(tx);

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

      const settings = await loadSettings(tx);
      const { durationMinutes, priceCents } = quote(checked.choice, settings.nailArtDefaultBufferMinutes);

      // 3. Tijd opnieuw toetsen, met verse openingstijden, afwijkingen en bezetting.
      if (!(await isPublicSlotFree(tx, input.startAt, durationMinutes, settings))) {
        return { ok: false, reason: "tijd-niet-beschikbaar" } as const;
      }

      // 4. Klant (één per e-mailadres) en aanvraag.
      const customerId = await findOrCreateCustomer(tx, input);
      const endAt = new Date(input.startAt.getTime() + durationMinutes * 60 * 1000);
      const expiresAt = pendingExpiry(input.startAt, settings);

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
          variantLabel: variantSnapshotLabel(row.variant),
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
