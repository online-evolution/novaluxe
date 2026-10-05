import { defineConfig } from "drizzle-kit";

// drizzle-kit leest .env.local niet zelf in.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Geen .env.local: gebruik de omgeving (bijv. CI).
}

// Migraties via de directe verbinding, niet via de pooler.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL ontbreekt. Zie .env.example.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: { url },
  strict: true,
});
