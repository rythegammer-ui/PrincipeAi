import { and, eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { seedSequences, sequenceCopyUpgrades } from "@/db/seed-content/sequences";
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

/** As seeded (never edited: updated_at stays at created_at), or as saved by the owner in the editor. */
const setBody = async (db: DB, id: string, body: string) =>
  db.update(schema.sequenceSteps).set({ body, updatedAt: sql`${schema.sequenceSteps.createdAt}` }).where(eq(schema.sequenceSteps.id, id));
const ownerSaves = async (db: DB, id: string, body: string) =>
  db
    .update(schema.sequenceSteps)
    .set({ body, updatedAt: sql`${schema.sequenceSteps.createdAt} + interval '1 hour'` })
    .where(eq(schema.sequenceSteps.id, id));

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
    await ownerSaves(db, guideStep.id, current.replace(guide.to, guide.from));
    expect(await upgradeSequenceCopy()).toBe(0);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toContain(guide.from);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).not.toContain(guide.to);

    const [marker] = await db.select().from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    expect(marker.value).toEqual(sequenceCopyUpgrades.map((u) => u.id));
  });

  it("leaves emails the owner edited, paragraphs they extended, and waits while the courses aren't for sale", async () => {
    await db.delete(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    const guideStep = await stepFor(db, guide.sequence, guide.subject);
    const assessmentStep = await stepFor(db, assessment.sequence, assessment.subject);
    // Each email as an older version seeded it: today's seed copy with the old paragraph.
    const seeded = (u: (typeof sequenceCopyUpgrades)[number]) =>
      seedSequences.find((q) => q.name === u.sequence)!.steps.find((st) => st.subject === u.subject)!.body.replace(u.to, u.from);
    const oldGuide = seeded(guide);
    const oldAssessment = seeded(assessment);

    // A course it pitches is unpublished: nothing changes and the upgrade isn't used up.
    await setBody(db, guideStep.id, oldGuide);
    await setBody(db, assessmentStep.id, oldAssessment);
    await db.update(schema.courses).set({ published: false }).where(eq(schema.courses.slug, "ai-for-business"));
    expect(await upgradeSequenceCopy()).toBe(0);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toBe(oldGuide);
    expect((await db.select().from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY)))).toHaveLength(0);
    await db.update(schema.courses).set({ published: true }).where(eq(schema.courses.slug, "ai-for-business"));

    // The owner edited the guide email elsewhere, and added a line to the assessment paragraph.
    await ownerSaves(db, guideStep.id, `${oldGuide}\n\nP.S. Reply any time.`);
    await setBody(db, assessmentStep.id, oldAssessment.replace(assessment.from, `${assessment.from} Use code SAVE10.`));
    expect(await upgradeSequenceCopy()).toBe(0);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toBe(`${oldGuide}\n\nP.S. Reply any time.`);
    expect((await stepFor(db, assessment.sequence, assessment.subject)).body).toContain("Use code SAVE10.");
    expect((await stepFor(db, assessment.sequence, assessment.subject)).body).not.toContain(assessment.to);
    const done = await db.select().from(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    expect(done[0].value).toEqual(sequenceCopyUpgrades.map((u) => u.id));
  });

  it("still upgrades an email whose only change was a reordering of the sequence", async () => {
    await db.delete(schema.settings).where(eq(schema.settings.key, COPY_UPGRADES_KEY));
    const guideStep = await stepFor(db, guide.sequence, guide.subject);
    const seededGuide = seedSequences.find((q) => q.name === guide.sequence)!.steps.find((st) => st.subject === guide.subject)!.body;
    // Exactly as the older version seeded it, but its updated_at moved (another email was moved or deleted).
    await ownerSaves(db, guideStep.id, seededGuide.replace(guide.to, guide.from));
    expect(await upgradeSequenceCopy()).toBeGreaterThanOrEqual(1);
    expect((await stepFor(db, guide.sequence, guide.subject)).body).toBe(seededGuide);
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
