/**
 * Brings default email copy seeded before a feature existed up to date (e.g. course buy links): see
 * `sequenceCopyUpgrades` in src/db/seed-content/sequences.ts. Run by scripts/migrate.ts on every build.
 */
import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema";
import { sequenceCopyUpgrades } from "../src/db/seed-content/sequences";

type DB = PostgresJsDatabase<typeof schema>;

/** Settings row listing the upgrades already applied, so each runs once and an owner's later edit is never undone. */
export const COPY_UPGRADES_KEY = "seedCopyUpgradesApplied";

/**
 * Applies each upgrade once, and only to steps where the owner hasn't rewritten that paragraph. A database seeded
 * just now already has the new copy, so its upgrades are only marked done. Returns how many steps changed.
 */
export async function upgradeSequenceCopy(db: DB, freshlySeeded: boolean): Promise<number> {
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY)).limit(1);
  const applied = new Set(Array.isArray(row?.value) ? (row.value as unknown[]).filter((v): v is string => typeof v === "string") : []);
  const before = applied.size;
  let changed = 0;
  for (const u of sequenceCopyUpgrades) {
    if (applied.has(u.id)) continue;
    applied.add(u.id);
    if (freshlySeeded) continue;
    const steps = await db
      .select({ id: schema.sequenceSteps.id, body: schema.sequenceSteps.body })
      .from(schema.sequenceSteps)
      .innerJoin(schema.emailSequences, eq(schema.emailSequences.id, schema.sequenceSteps.sequenceId))
      .where(and(eq(schema.emailSequences.name, u.sequence), eq(schema.sequenceSteps.subject, u.subject)));
    for (const step of steps) {
      if (!step.body.includes(u.from) || step.body.includes(u.to)) continue;
      await db.update(schema.sequenceSteps).set({ body: step.body.replace(u.from, () => u.to) }).where(eq(schema.sequenceSteps.id, step.id));
      changed++;
    }
  }
  if (applied.size !== before) {
    const value = [...applied];
    await db
      .insert(schema.settings)
      .values({ key: COPY_UPGRADES_KEY, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: new Date() } });
  }
  return changed;
}
