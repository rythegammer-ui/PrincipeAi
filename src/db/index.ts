import "server-only";
import path from "node:path";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { databaseUrl, dbMode, missingDatabaseError } from "@/lib/runtime-mode";

export type DB = PostgresJsDatabase<typeof schema>;

export { schema };
export { databaseUrl, dbMode, isDemoMode, type DbMode } from "@/lib/runtime-mode";

const MIGRATIONS_FOLDER = path.join(process.cwd(), "drizzle");

type GlobalDb = { __principeDb?: Promise<DB> };
const g = globalThis as unknown as GlobalDb;

async function createPglite(dataDir: string): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  if (dataDir !== "memory://") {
    const fs = await import("node:fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  const { rekeyProspects } = await import("../lib/sales/match-keys");
  await rekeyProspects(db as unknown as DB);
  const { seedIfEmpty } = await import("./seed");
  // The PGlite and postgres-js drivers expose the same query-builder API.
  await seedIfEmpty(db as unknown as DB, { demoData: true });
  return db as unknown as DB;
}

function createPostgres(url: string): DB {
  const client = postgres(url, {
    // Transaction-mode poolers (Supabase, Neon pooled URLs) don't support prepared statements.
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    idle_timeout: 20,
    connect_timeout: 15,
  });
  return drizzlePostgres(client, { schema });
}

/**
 * Get the database. Always `await getDb()` inside request handlers / server components —
 * never at module top level (that would run during build).
 */
export function getDb(): Promise<DB> {
  if (!g.__principeDb) {
    // A deployment that lost (or never had) its database fails closed instead of becoming a public demo.
    const missing = missingDatabaseError();
    if (missing) return Promise.reject(new Error(missing));
    const url = databaseUrl();
    const mode = dbMode();
    g.__principeDb = url
      ? Promise.resolve(createPostgres(url))
      : createPglite(mode === "pglite-memory" ? "memory://" : process.env.PGLITE_DIR || path.join(process.cwd(), ".data", "pglite"));
    g.__principeDb.catch(() => {
      g.__principeDb = undefined;
    });
  }
  return g.__principeDb;
}
