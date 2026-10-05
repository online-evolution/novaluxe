import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { CatalogTreatment } from "@/domain/catalog";
import { cacheTags } from "./cache-tags";
import { getDb } from "./db";
import {
  treatmentOptionRules,
  treatmentOptions,
  treatments,
  treatmentVariants,
} from "./db/schema";

/**
 * Alle actieve behandelingen met actieve varianten en opties, in de volgorde
 * die Jessie heeft ingesteld. Gecachet tot een adminwijziging de tag ververst.
 */
export async function getCatalog(): Promise<CatalogTreatment[]> {
  "use cache";
  cacheTag(cacheTags.catalog);
  cacheLife("max");

  const db = getDb();
  const [treatmentRows, variantRows, optionRows] = await Promise.all([
    db
      .select()
      .from(treatments)
      .where(eq(treatments.active, true))
      .orderBy(asc(treatments.sortOrder)),
    db
      .select()
      .from(treatmentVariants)
      .where(eq(treatmentVariants.active, true))
      .orderBy(asc(treatmentVariants.sortOrder)),
    db
      .select({
        treatmentId: treatmentOptionRules.treatmentId,
        variantKind: treatmentOptionRules.variantKind,
        option: treatmentOptions,
      })
      .from(treatmentOptionRules)
      .innerJoin(treatmentOptions, eq(treatmentOptionRules.optionId, treatmentOptions.id))
      .where(eq(treatmentOptions.active, true))
      .orderBy(asc(treatmentOptions.sortOrder)),
  ]);

  return treatmentRows.map((treatment) => ({
    id: treatment.id,
    slug: treatment.slug,
    category: treatment.category,
    name: treatment.name,
    summary: treatment.summary,
    publiclyBookable: treatment.publiclyBookable,
    sortOrder: treatment.sortOrder,
    variants: variantRows
      .filter((variant) => variant.treatmentId === treatment.id)
      .map((variant) => ({
        id: variant.id,
        label: variant.label,
        kind: variant.kind,
        lengthCm: variant.lengthCm,
        weftRows: variant.weftRows,
        priceCents: variant.priceCents,
        durationMinutes: variant.durationMinutes,
        note: variant.note,
        sortOrder: variant.sortOrder,
      })),
    options: optionRows
      .filter((row) => row.treatmentId === treatment.id)
      .map(({ option, variantKind }) => ({
        id: option.id,
        kind: option.kind,
        name: option.name,
        priceCents: option.priceCents,
        priceConfirmed: option.priceConfirmed,
        durationMinutes: option.durationMinutes,
        variantKind,
      })),
  }));
}

export async function getTreatment(slug: string): Promise<CatalogTreatment | undefined> {
  const catalog = await getCatalog();
  return catalog.find((treatment) => treatment.slug === slug);
}
