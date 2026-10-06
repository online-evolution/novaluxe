import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/server/db";
import { treatmentOptions, treatments, treatmentVariants } from "@/server/db/schema";

/*
 * Beheer van behandelingen en opties. Alleen aanroepen na requireAdmin();
 * de serveracties in src/app/admin regelen dat.
 */

export async function listTreatmentsForAdmin() {
  const db = getDb();
  const [treatmentRows, variantRows] = await Promise.all([
    db.select().from(treatments).orderBy(asc(treatments.sortOrder)),
    db
      .select({
        treatmentId: treatmentVariants.treatmentId,
        active: treatmentVariants.active,
        priceCents: treatmentVariants.priceCents,
        durationMinutes: treatmentVariants.durationMinutes,
      })
      .from(treatmentVariants),
  ]);

  return treatmentRows.map((treatment) => {
    const variants = variantRows.filter((variant) => variant.treatmentId === treatment.id);
    return {
      ...treatment,
      variantCount: variants.length,
      incompleteCount: variants.filter(
        (variant) => variant.active && (variant.priceCents === null || variant.durationMinutes === null),
      ).length,
    };
  });
}

export async function getTreatmentForAdmin(slug: string) {
  const db = getDb();
  const [treatment] = await db.select().from(treatments).where(eq(treatments.slug, slug)).limit(1);
  if (!treatment) return null;
  const variants = await db
    .select()
    .from(treatmentVariants)
    .where(eq(treatmentVariants.treatmentId, treatment.id))
    .orderBy(asc(treatmentVariants.sortOrder));
  return { ...treatment, variants };
}

export type VariantUpdate = {
  id: string;
  priceCents: number | null;
  durationMinutes: number | null;
  active: boolean;
};

/** Slaat een behandeling en al haar varianten in één keer op. */
export async function saveTreatment(input: {
  treatmentId: string;
  active: boolean;
  variants: VariantUpdate[];
}) {
  await getDb().transaction(async (tx) => {
    await tx
      .update(treatments)
      .set({ active: input.active })
      .where(eq(treatments.id, input.treatmentId));

    // Alleen varianten die echt bij deze behandeling horen.
    const ids = input.variants.map((variant) => variant.id);
    const owned = ids.length
      ? await tx
          .select({ id: treatmentVariants.id })
          .from(treatmentVariants)
          .where(
            and(eq(treatmentVariants.treatmentId, input.treatmentId), inArray(treatmentVariants.id, ids)),
          )
      : [];
    const ownedIds = new Set(owned.map((row) => row.id));

    for (const variant of input.variants) {
      if (!ownedIds.has(variant.id)) continue;
      await tx
        .update(treatmentVariants)
        .set({
          priceCents: variant.priceCents,
          durationMinutes: variant.durationMinutes,
          active: variant.active,
        })
        .where(eq(treatmentVariants.id, variant.id));
    }
  });
}

export async function listOptionsForAdmin() {
  return getDb().select().from(treatmentOptions).orderBy(asc(treatmentOptions.sortOrder));
}

export type OptionUpdate = {
  id: string;
  priceCents: number | null;
  durationMinutes: number | null;
  priceConfirmed: boolean;
  active: boolean;
};

export async function saveOptions(updates: OptionUpdate[]) {
  await getDb().transaction(async (tx) => {
    for (const option of updates) {
      await tx
        .update(treatmentOptions)
        .set({
          priceCents: option.priceCents,
          durationMinutes: option.durationMinutes,
          priceConfirmed: option.priceConfirmed,
          active: option.active,
        })
        .where(eq(treatmentOptions.id, option.id));
    }
  });
}
