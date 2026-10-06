/*
 * Maakt een beheerder aan, of zet een nieuw wachtwoord voor een bestaande.
 * Er is bewust geen openbare registratie.
 *
 *   npm run admin:create -- jessie@voorbeeld.nl "Jessie"
 *   npm run admin:create -- jessie@voorbeeld.nl "Jessie" --reset
 *
 * Het wachtwoord wordt willekeurig gegenereerd en één keer getoond. Wil je
 * het naar een bestand schrijven in plaats van tonen, geef dan
 * `--write-to <bestand>` mee. Na het inloggen kan de beheerder het wijzigen
 * onder Account.
 *
 * Standaard op de dev-database (.env.local). Voor productie:
 *   node --env-file=.env.production.local --import tsx scripts/create-admin.ts …
 */
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import { z } from "zod";
import { hashPassword } from "../src/server/auth/password";
import * as schema from "../src/server/db/schema";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Geen .env.local: gebruik de omgeving.
}

const args = process.argv.slice(2);
const [email, name] = args.filter((arg) => !arg.startsWith("--"));
const reset = args.includes("--reset");
const writeTo = args.includes("--write-to") ? args[args.indexOf("--write-to") + 1] : undefined;

const input = z.object({ email: z.email(), name: z.string().min(1) }).safeParse({ email, name });
if (!input.success) {
  console.error('Gebruik: npm run admin:create -- <e-mailadres> "<naam>" [--reset] [--write-to <bestand>]');
  process.exit(1);
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ontbreekt. Zie .env.example.");

const pool = new Pool({ connectionString: url });
const db = drizzle({ client: pool, schema, casing: "snake_case" });

async function main() {
  const password = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(password);
  const normalised = input.data!.email.toLowerCase();

  const [existing] = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(sql`lower(${schema.adminUsers.email}) = ${normalised}`);

  if (existing && !reset) {
    throw new Error("Dit e-mailadres bestaat al. Gebruik --reset voor een nieuw wachtwoord.");
  }

  if (existing) {
    await db
      .update(schema.adminUsers)
      .set({ passwordHash, name: input.data!.name, active: true })
      .where(eq(schema.adminUsers.id, existing.id));
    // Bestaande sessies vervallen bij een reset.
    await db.delete(schema.adminSessions).where(eq(schema.adminSessions.adminUserId, existing.id));
  } else {
    await db.insert(schema.adminUsers).values({
      email: normalised,
      name: input.data!.name,
      passwordHash,
    });
  }

  const target = new URL(url!).host;
  if (writeTo) {
    appendFileSync(
      writeTo,
      `\n# Testbeheerder (aangemaakt met --write-to)\nTEST_ADMIN_EMAIL=${normalised}\nTEST_ADMIN_PASSWORD=${password}\n`,
    );
    console.log(`Beheerder ${existing ? "bijgewerkt" : "aangemaakt"} op ${target}; gegevens weggeschreven naar ${writeTo}.`);
  } else {
    console.log(`Beheerder ${existing ? "bijgewerkt" : "aangemaakt"} op ${target}.`);
    console.log(`E-mailadres: ${normalised}`);
    console.log(`Wachtwoord:  ${password}   (wordt niet opnieuw getoond)`);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
