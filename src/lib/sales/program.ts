import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { DEFAULT_PROGRAM, MAX_RATE_BPS, normalizeLevels, type ProgramSettings } from "@/lib/sales/game";

/** The sales-agent program settings (Admin → Sales Team → Program), stored in `settings` under this key. */
export const PROGRAM_KEY = "salesProgram";

const levelSchema = z.object({
  key: z.string().max(40),
  name: z.string().max(40),
  minSales: z.number().int().min(0).max(100_000),
  rateBps: z.number().int().min(0).max(MAX_RATE_BPS),
});

export const programSchema = z.object({
  applicationsOpen: z.boolean(),
  levels: z.array(levelSchema).min(1).max(8),
  holdDays: z.number().int().min(0).max(180),
  attributionDays: z.number().int().min(1).max(3650),
  minPayoutCents: z.number().int().min(0).max(1_000_000),
  payoutSchedule: z.string().max(200),
});

/** The saved program settings, with defaults for anything missing or invalid. */
export async function getSalesProgram(): Promise<ProgramSettings> {
  const db = await getDb();
  const [row] = await db.select({ value: schema.settings.value }).from(schema.settings).where(eq(schema.settings.key, PROGRAM_KEY)).limit(1);
  const parsed = programSchema.partial().safeParse(row?.value ?? {});
  const saved = parsed.success ? parsed.data : {};
  return { ...DEFAULT_PROGRAM, ...saved, levels: normalizeLevels(saved.levels ?? DEFAULT_PROGRAM.levels) };
}

export async function saveSalesProgram(program: ProgramSettings): Promise<ProgramSettings> {
  const clean: ProgramSettings = { ...programSchema.parse(program), levels: normalizeLevels(program.levels) };
  const db = await getDb();
  await db
    .insert(schema.settings)
    .values({ key: PROGRAM_KEY, value: clean, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: clean, updatedAt: new Date() } });
  return clean;
}
