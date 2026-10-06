import "server-only";
import { z } from "zod";

/*
 * Server-side configuratie. Waarden worden pas gevalideerd wanneer ze nodig
 * zijn, zodat pagina's zonder database (zoals de specimenpagina) kunnen
 * bouwen voordat Neon gekoppeld is.
 */
const databaseSchema = z.object({
  DATABASE_URL: z
    .url()
    .refine((value) => value.startsWith("postgres"), "Verwacht een Postgres-URL"),
});

const authSchema = z.object({
  AUTH_SECRET: z.string().min(32),
});

export function getAuthEnv() {
  const parsed = authSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("AUTH_SECRET ontbreekt of is te kort. Zie .env.example.");
  }
  return parsed.data;
}

export function getDatabaseEnv() {
  const parsed = databaseSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "DATABASE_URL ontbreekt of is ongeldig. Zie .env.example.",
    );
  }
  return parsed.data;
}
