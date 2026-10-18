import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { PromptCourse, PromptMeetingType } from "@/lib/ai-prompts";

export type AssistantKnowledge = { courses: PromptCourse[]; meetingTypes: PromptMeetingType[] };

/**
 * Live catalog data for the assistant's knowledge base: published courses (with lesson
 * counts) and active meeting types. Read fresh on every request so prices are always current.
 */
export async function loadAssistantKnowledge(): Promise<AssistantKnowledge> {
  const db = await getDb();
  const c = schema.courses;
  const l = schema.lessons;
  const m = schema.meetingTypes;
  const [courses, lessonStats, meetingTypes] = await Promise.all([
    db
      .select({
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        audience: c.audience,
        level: c.level,
        priceCents: c.priceCents,
        compareAtCents: c.compareAtCents,
        outcomes: c.outcomes,
        includes: c.includes,
        faqs: c.faqs,
        published: c.published,
        sortOrder: c.sortOrder,
        id: c.id,
      })
      .from(c)
      .where(eq(c.published, true))
      .orderBy(asc(c.sortOrder), asc(c.slug)),
    db
      .select({
        courseId: l.courseId,
        lessonCount: sql<number>`count(*)::int`,
        totalMinutes: sql<number>`coalesce(sum(${l.durationMin}), 0)::int`,
      })
      .from(l)
      .groupBy(l.courseId),
    db
      .select({
        slug: m.slug,
        name: m.name,
        description: m.description,
        durationMin: m.durationMin,
        priceCents: m.priceCents,
        active: m.active,
        sortOrder: m.sortOrder,
      })
      .from(m)
      .where(eq(m.active, true))
      .orderBy(asc(m.sortOrder), asc(m.slug)),
  ]);
  const stats = new Map(lessonStats.map((s) => [s.courseId, s]));
  return {
    courses: courses.map(({ id, ...course }) => ({
      ...course,
      lessonCount: Number(stats.get(id)?.lessonCount ?? 0),
      totalMinutes: Number(stats.get(id)?.totalMinutes ?? 0),
    })),
    meetingTypes,
  };
}
