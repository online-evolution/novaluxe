import "server-only";
import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { getDatabaseEnv } from "@/server/env";
import * as schema from "./schema";

/*
 * WebSocket-pool i.p.v. de HTTP-driver: de reserveringsflow heeft
 * interactieve transacties nodig (lock → beschikbaarheid → insert).
 */
let db: NeonDatabase<typeof schema> | undefined;

export function getDb(): NeonDatabase<typeof schema> {
  if (!db) {
    const pool = new Pool({ connectionString: getDatabaseEnv().DATABASE_URL });
    db = drizzle({ client: pool, schema, casing: "snake_case" });
  }
  return db;
}
