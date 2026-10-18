/**
 * Sample CRM data so the admin dashboard isn't empty in local dev / demo mode.
 * Every sample contact is tagged "sample" and uses an @example.com address.
 * Never runs against a real Postgres database unless SEED_DEMO_DATA=1.
 */
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;

export async function seedDemoData(db: DB): Promise<void> {
  // Filled in by the CRM/analytics build step.
  void db;
}
