import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { sequenceCopyUpgrades } from "@/db/seed-content/sequences";
import { COPY_UPGRADES_KEY, upgradeSequenceCopy } from "@/lib/automations";

type DB = Awaited<ReturnType<typeof getDb>>;

async function stepFor(db: DB, sequence: string, subject: string) {
  const [row] = await db
    .select({ id: schema.sequenceSteps.id, body: schema.sequenceSteps.body })
    .from(schema.sequenceSteps)
    .innerJoin(schema.emailSequences, eq(schema.emailSequences.id, schema.sequenceSteps.sequenceId))
    .where(and(eq(schema.emailSequences.name, sequence), eq(schema.sequenceSteps.subject, subject)));
  if (!row) throw new Error(`missing step ${sequence} / ${subject}`);
  return row;
}

const setBody = async (db: DB, id: string, body: string) => db.update(schema.sequenceSteps).set({ body }).where(eq(schema.sequenceSteps.id, id));

describe("default email copy upgrades", () => {
  let db: DB;
  const [guide, assessment] = sequenceCopyUpgrades;

  beforeAll(async () => {
    db = await getDb();
  }, 60_000);

  it("adds the buy links to emails seeded before them, once, leaving rewritten emails alone", async () => {
    const guideStep = await stepFor(db, guide.sequence, guide.subject);
    const assessmentStep = await stepFor(db, assessment.sequence, assessment.subject);
    const current = guideStep.body;
    // As seeded by an older version: the old paragraph. The owner rewrote the other email's paragraph.
    await setBody(db, guideStep.id, current.replace(guide.to, guide.from));
    await setBody(db, assessmentStep.id, assessmentStep.body.replace(assessment.to, "Our courses are great, have a look: {{coursesUrl}}"));

    expect(await upgradeSequenceCopy()).toBe(1);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toBe(current);
    expect((await stepFor(db, assessment.sequence, assessment.subject)).body).toContain("Our courses are great");

    // The owner later removes the links again: a later run doesn't put them back.
    await setBody(db, guideStep.id, current.replace(guide.to, guide.from));
    expect(await upgradeSequenceCopy()).toBe(0);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toContain(guide.from);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).not.toContain(guide.to);

    const [marker] = await db.select().from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    expect(marker.value).toEqual(sequenceCopyUpgrades.map((u) => u.id));
  });

  it("only records the upgrades for a database seeded with the new copy", async () => {
    await db.delete(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    const guideStep = await stepFor(db, guide.sequence, guide.subject);
    await setBody(db, guideStep.id, guideStep.body.includes(guide.to) ? guideStep.body : guideStep.body.replace(guide.from, guide.to));
    const seeded = (await stepFor(db, guide.sequence, guide.subject)).body;
    expect(await upgradeSequenceCopy()).toBe(0);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toBe(seeded);
    const [marker] = await db.select().from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    expect(marker.value).toEqual(sequenceCopyUpgrades.map((u) => u.id));
  });
});
