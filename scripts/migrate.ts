/**
 * Applies SQL migrations in ./drizzle to DATABASE_URL (or POSTGRES_URL) and seeds the
 * default catalog if the database is empty. Runs automatically during `vercel-build`.
 * Without a database URL it exits quietly (locally the app falls back to embedded PGlite).
 */
import "dotenv/config";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { seedIfEmpty } from "../src/db/seed";

async function main() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.log(
      process.env.VERCEL
        ? "[migrate] No DATABASE_URL/POSTGRES_URL set — skipping. The deployment won't serve data until a database is connected (or DEMO_MODE=1 for an in-memory demo)."
        : "[migrate] No DATABASE_URL/POSTGRES_URL set — skipping (embedded PGlite will be used).",
    );
    return;
  }
  // Prefer a direct (non-pooled) connection for DDL when the provider exposes one.
  const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || url;
  const client = postgres(migrationUrl, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client, { schema });
  console.log("[migrate] Applying migrations…");
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const res = await seedIfEmpty(db, { demoData: process.env.SEED_DEMO_DATA === "1" });
  console.log(res.seeded ? "[migrate] Seeded default catalog." : "[migrate] Database already seeded.");
  await client.end();
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
