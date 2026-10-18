/**
 * Idempotent seed. Inserts the default catalog, scheduling setup, and email automations
 * when the database is empty. Safe to run on every boot / deploy.
 *
 * NOTE: no "server-only" import here — this module is also used by scripts/seed.ts.
 */
import { count } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { seedCourses } from "./seed-content/courses";
import { seedSequences } from "./seed-content/sequences";

type DB = PostgresJsDatabase<typeof schema>;

export const defaultMeetingTypes: (typeof schema.meetingTypes.$inferInsert)[] = [
  {
    slug: "ai-strategy-call",
    name: "Free AI Strategy Call",
    description:
      "A 30-minute call to map where AI can save you the most time and money — and whether our courses or done-with-you implementation is the right fit.",
    durationMin: 30,
    priceCents: 0,
    locationLabel: "Google Meet / Zoom",
    bufferMin: 15,
    minNoticeHours: 12,
    maxDaysAhead: 30,
    questions: [
      { id: "goal", label: "What's the #1 thing you'd like AI to help you with?", required: true },
      { id: "business", label: "Tell us about your business or role (optional)", required: false },
    ],
    color: "violet",
    sortOrder: 0,
  },
  {
    slug: "ai-coaching-session",
    name: "1:1 AI Coaching Session",
    description:
      "60 minutes of hands-on coaching. Bring your real work — we'll build prompts, workflows, or automations together live.",
    durationMin: 60,
    priceCents: 15000,
    locationLabel: "Zoom",
    bufferMin: 15,
    minNoticeHours: 24,
    maxDaysAhead: 45,
    questions: [{ id: "agenda", label: "What would you like to work on together?", required: true }],
    color: "amber",
    sortOrder: 1,
  },
  {
    slug: "implementation-discovery",
    name: "AI Implementation Discovery Call",
    description:
      "For businesses ready to have AI systems built for them. 45 minutes to scope your project, timeline, and investment.",
    durationMin: 45,
    priceCents: 0,
    locationLabel: "Zoom",
    bufferMin: 15,
    minNoticeHours: 24,
    maxDaysAhead: 30,
    questions: [
      { id: "company", label: "Company name and website", required: true },
      { id: "project", label: "What would you like to automate or build with AI?", required: true },
      { id: "budget", label: "Rough budget range", required: false },
    ],
    color: "emerald",
    sortOrder: 2,
  },
];

/** Mon–Fri 9:00–17:00 in the business timezone. */
export const defaultAvailability = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  startMinute: 9 * 60,
  endMinute: 17 * 60,
}));

export async function seedCatalog(db: DB) {
  for (const [i, c] of seedCourses.entries()) {
    const [course] = await db
      .insert(schema.courses)
      .values({
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        audience: c.audience,
        level: c.level,
        priceCents: c.priceCents,
        compareAtCents: c.compareAtCents ?? null,
        coverEmoji: c.coverEmoji,
        featured: c.featured ?? false,
        outcomes: c.outcomes,
        includes: c.includes,
        faqs: c.faqs,
        sortOrder: i,
      })
      .returning();
    for (const [mi, m] of c.modules.entries()) {
      const [mod] = await db
        .insert(schema.courseModules)
        .values({ courseId: course.id, title: m.title, position: mi })
        .returning();
      if (m.lessons.length) {
        await db.insert(schema.lessons).values(
          m.lessons.map((l, li) => ({
            courseId: course.id,
            moduleId: mod.id,
            slug: l.slug,
            title: l.title,
            summary: l.summary,
            content: l.content,
            durationMin: l.durationMin,
            isPreview: l.isPreview ?? false,
            videoUrl: l.videoUrl ?? null,
            position: li,
          })),
        );
      }
    }
  }
}

export async function seedAutomations(db: DB) {
  for (const s of seedSequences) {
    const [seq] = await db
      .insert(schema.emailSequences)
      .values({ name: s.name, description: s.description, trigger: s.trigger })
      .returning();
    if (s.steps.length) {
      await db.insert(schema.sequenceSteps).values(
        s.steps.map((step, position) => ({ sequenceId: seq.id, position, ...step })),
      );
    }
  }
}

export async function seedScheduling(db: DB) {
  await db.insert(schema.meetingTypes).values(defaultMeetingTypes);
  await db.insert(schema.availabilityRules).values(defaultAvailability);
}

export async function seedIfEmpty(db: DB, opts: { demoData?: boolean } = {}) {
  const [{ value: courseCount }] = await db.select({ value: count() }).from(schema.courses);
  if (courseCount > 0) return { seeded: false };
  await seedCatalog(db);
  await seedScheduling(db);
  await seedAutomations(db);
  if (opts.demoData && process.env.SEED_DEMO_DATA !== "0") {
    const { seedDemoData } = await import("./seed-demo");
    await seedDemoData(db);
  }
  return { seeded: true };
}
