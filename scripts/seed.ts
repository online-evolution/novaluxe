/*
 * Vult een lege database met de startgegevens. Veilig om opnieuw te draaien:
 * bestaande rijen (en dus wijzigingen van Jessie) blijven ongemoeid.
 *
 *   npm run db:seed
 */
import { Pool } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { defaultSettings, settingKeys } from "../src/domain/settings";
import * as schema from "../src/server/db/schema";
import {
  seedBusinessHours,
  seedOptions,
  seedTreatments,
} from "../src/server/db/seed-data";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Geen .env.local: gebruik de omgeving.
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ontbreekt. Zie .env.example.");

const pool = new Pool({ connectionString: url });
const db = drizzle({ client: pool, schema, casing: "snake_case" });

async function main() {
  await db.transaction(async (tx) => {
    for (const [treatmentIndex, treatment] of seedTreatments.entries()) {
      await tx
        .insert(schema.treatments)
        .values({
          slug: treatment.slug,
          category: treatment.category,
          name: treatment.name,
          publiclyBookable: treatment.publiclyBookable ?? true,
          sortOrder: (treatmentIndex + 1) * 10,
        })
        .onConflictDoNothing({ target: schema.treatments.slug });

      const [row] = await tx
        .select({ id: schema.treatments.id })
        .from(schema.treatments)
        .where(eq(schema.treatments.slug, treatment.slug));
      if (!row) throw new Error(`Behandeling ${treatment.slug} niet gevonden`);

      await tx
        .insert(schema.treatmentVariants)
        .values(
          treatment.variants.map((variant, variantIndex) => ({
            treatmentId: row.id,
            label: variant.label,
            kind: variant.kind ?? "standard",
            lengthCm: variant.lengthCm ?? null,
            weftRows: variant.weftRows ?? null,
            priceCents: variant.priceCents,
            durationMinutes: variant.durationMinutes,
            note: variant.note ?? null,
            sortOrder: (variantIndex + 1) * 10,
          })),
        )
        .onConflictDoNothing();
    }

    for (const [optionIndex, option] of seedOptions.entries()) {
      await tx
        .insert(schema.treatmentOptions)
        .values({
          kind: option.kind,
          name: option.name,
          priceCents: option.priceCents,
          priceConfirmed: option.priceConfirmed,
          durationMinutes: option.durationMinutes,
          sortOrder: (optionIndex + 1) * 10,
        })
        .onConflictDoNothing({ target: schema.treatmentOptions.kind });

      const [optionRow] = await tx
        .select({ id: schema.treatmentOptions.id })
        .from(schema.treatmentOptions)
        .where(eq(schema.treatmentOptions.kind, option.kind));
      if (!optionRow) throw new Error(`Optie ${option.kind} niet gevonden`);

      for (const rule of option.appliesTo) {
        const [treatmentRow] = await tx
          .select({ id: schema.treatments.id })
          .from(schema.treatments)
          .where(eq(schema.treatments.slug, rule.slug));
        if (!treatmentRow) throw new Error(`Behandeling ${rule.slug} niet gevonden`);
        await tx
          .insert(schema.treatmentOptionRules)
          .values({
            optionId: optionRow.id,
            treatmentId: treatmentRow.id,
            variantKind: rule.variantKind,
          })
          .onConflictDoNothing();
      }
    }

    // Openingstijden alleen als er nog niets staat: anders zijn ze al door Jessie beheerd.
    const [{ count }] = (await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.businessHours)) as [{ count: number }];
    if (count === 0) {
      await tx.insert(schema.businessHours).values(seedBusinessHours);
    }

    await tx
      .insert(schema.settings)
      .values(
        settingKeys.map((key) => ({
          key,
          // JSON-null ("nog niet vastgesteld"), geen SQL-NULL.
          value: defaultSettings[key] ?? sql`'null'::jsonb`,
        })),
      )
      .onConflictDoNothing({ target: schema.settings.key });
  });

  const summary = await db.execute(sql`
    select
      (select count(*) from treatments) as treatments,
      (select count(*) from treatment_variants) as variants,
      (select count(*) from treatment_variants where price_cents is null or duration_minutes is null) as incomplete,
      (select count(*) from treatment_options) as options,
      (select count(*) from treatment_option_rules) as option_rules,
      (select count(*) from business_hours) as business_hours,
      (select count(*) from settings) as settings
  `);
  console.log("Seed klaar:", summary.rows[0]);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
