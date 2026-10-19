import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Course, CourseModule, Lesson, User } from "@/db/schema";
import { createLoginToken, upsertStudent } from "@/lib/auth";
import { logActivity, upsertContact } from "@/lib/crm";
import { sendEmail } from "@/lib/email";
import { absoluteUrl, firstName, normalizeEmail } from "@/lib/utils";

/**
 * Course catalog, curriculum, progress and access helpers.
 * OWNER: courses & payments feature.
 */

/** Lesson fields needed for curriculum lists (everything except the Markdown body). */
export type CurriculumLesson = Pick<
  Lesson,
  "id" | "moduleId" | "courseId" | "slug" | "title" | "summary" | "durationMin" | "isPreview" | "videoUrl" | "position"
>;
export type CurriculumModule = CourseModule & { lessons: CurriculumLesson[] };

export type CourseWithCurriculum = {
  course: Course;
  modules: CurriculumModule[];
  /** All lessons in course order (module position, then lesson position). */
  lessons: CurriculumLesson[];
  lessonCount: number;
  totalMinutes: number;
};

export type CourseSummary = Course & { lessonCount: number; totalMinutes: number; previewLessonSlug: string | null };

export type CourseProgress = {
  completedLessonIds: string[];
  completed: number;
  total: number;
  /** 0–100, rounded. */
  percent: number;
};

const curriculumLessonColumns = {
  id: schema.lessons.id,
  moduleId: schema.lessons.moduleId,
  courseId: schema.lessons.courseId,
  slug: schema.lessons.slug,
  title: schema.lessons.title,
  summary: schema.lessons.summary,
  durationMin: schema.lessons.durationMin,
  isPreview: schema.lessons.isPreview,
  videoUrl: schema.lessons.videoUrl,
  position: schema.lessons.position,
};

/* ------------------------------------------------------------------ */
/* Catalog + curriculum                                                */
/* ------------------------------------------------------------------ */

/** Modules (ordered) with their lessons (ordered), plus the flattened lesson list. */
export async function getCurriculum(courseId: string): Promise<{ modules: CurriculumModule[]; lessons: CurriculumLesson[] }> {
  const db = await getDb();
  const [modules, lessons] = await Promise.all([
    db
      .select()
      .from(schema.courseModules)
      .where(eq(schema.courseModules.courseId, courseId))
      .orderBy(asc(schema.courseModules.position), asc(schema.courseModules.title)),
    db
      .select(curriculumLessonColumns)
      .from(schema.lessons)
      .where(eq(schema.lessons.courseId, courseId))
      .orderBy(asc(schema.lessons.position), asc(schema.lessons.title)),
  ]);
  const byModule = new Map<string, CurriculumLesson[]>();
  for (const l of lessons) {
    const list = byModule.get(l.moduleId) ?? [];
    list.push(l);
    byModule.set(l.moduleId, list);
  }
  const withLessons = modules.map((m) => ({ ...m, lessons: byModule.get(m.id) ?? [] }));
  return { modules: withLessons, lessons: withLessons.flatMap((m) => m.lessons) };
}

/** A course with its full curriculum. Unpublished courses are hidden unless `includeUnpublished`. */
export async function getCourseWithCurriculum(
  slug: string,
  opts: { includeUnpublished?: boolean } = {},
): Promise<CourseWithCurriculum | null> {
  const db = await getDb();
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1);
  if (!course || (!course.published && !opts.includeUnpublished)) return null;
  const { modules, lessons } = await getCurriculum(course.id);
  return {
    course,
    modules,
    lessons,
    lessonCount: lessons.length,
    totalMinutes: lessons.reduce((sum, l) => sum + l.durationMin, 0),
  };
}

/** Published courses in catalog order, with lesson counts and total runtime. */
export async function listPublishedCourses(): Promise<CourseSummary[]> {
  const db = await getDb();
  const courses = await db
    .select()
    .from(schema.courses)
    .where(eq(schema.courses.published, true))
    .orderBy(asc(schema.courses.sortOrder), asc(schema.courses.createdAt));
  return withLessonStats(courses);
}

async function withLessonStats(courses: Course[]): Promise<CourseSummary[]> {
  if (!courses.length) return [];
  const db = await getDb();
  const lessons = await db
    .select({
      courseId: schema.lessons.courseId,
      slug: schema.lessons.slug,
      durationMin: schema.lessons.durationMin,
      isPreview: schema.lessons.isPreview,
      position: schema.lessons.position,
      modulePosition: schema.courseModules.position,
    })
    .from(schema.lessons)
    .innerJoin(schema.courseModules, eq(schema.courseModules.id, schema.lessons.moduleId))
    .where(inArray(schema.lessons.courseId, courses.map((c) => c.id)))
    .orderBy(asc(schema.courseModules.position), asc(schema.lessons.position));
  const stats = new Map<string, { lessonCount: number; totalMinutes: number; previewLessonSlug: string | null }>();
  for (const l of lessons) {
    const s = stats.get(l.courseId) ?? { lessonCount: 0, totalMinutes: 0, previewLessonSlug: null };
    s.lessonCount += 1;
    s.totalMinutes += l.durationMin;
    if (l.isPreview && !s.previewLessonSlug) s.previewLessonSlug = l.slug;
    stats.set(l.courseId, s);
  }
  return courses.map((c) => ({ ...c, ...(stats.get(c.id) ?? { lessonCount: 0, totalMinutes: 0, previewLessonSlug: null }) }));
}

/** A single lesson (with its Markdown body) by course + lesson slug. */
export async function getLesson(courseId: string, lessonSlug: string): Promise<Lesson | null> {
  const db = await getDb();
  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(and(eq(schema.lessons.courseId, courseId), eq(schema.lessons.slug, lessonSlug)))
    .limit(1);
  return lesson ?? null;
}

/* ------------------------------------------------------------------ */
/* Access + progress                                                   */
/* ------------------------------------------------------------------ */

export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ courseId: schema.enrollments.courseId })
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
    .limit(1);
  return Boolean(row);
}

/** True when a student account with this email already has access to the course. */
export async function emailHasCourse(email: string, courseId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ courseId: schema.enrollments.courseId })
    .from(schema.enrollments)
    .innerJoin(schema.users, eq(schema.users.id, schema.enrollments.userId))
    .where(and(eq(schema.users.email, normalizeEmail(email)), eq(schema.enrollments.courseId, courseId)))
    .limit(1);
  return Boolean(row);
}

function progressFrom(lessons: Pick<CurriculumLesson, "id">[], completedIds: Iterable<string>): CourseProgress {
  const valid = new Set(lessons.map((l) => l.id));
  const completedLessonIds = [...new Set(completedIds)].filter((id) => valid.has(id));
  const total = lessons.length;
  const completed = completedLessonIds.length;
  return { completedLessonIds, completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

async function completedLessonIds(userId: string, courseId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ lessonId: schema.lessonProgress.lessonId })
    .from(schema.lessonProgress)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.lessonProgress.lessonId))
    .where(and(eq(schema.lessonProgress.userId, userId), eq(schema.lessons.courseId, courseId)));
  return rows.map((r) => r.lessonId);
}

export async function courseProgress(userId: string, courseId: string, lessons?: Pick<CurriculumLesson, "id">[]): Promise<CourseProgress> {
  const list = lessons ?? (await getCurriculum(courseId)).lessons;
  return progressFrom(list, await completedLessonIds(userId, courseId));
}

/** First incomplete lesson in course order; null when every lesson is complete (or there are none). */
export function firstIncomplete<T extends Pick<CurriculumLesson, "id">>(lessons: T[], completedIds: Iterable<string>): T | null {
  const done = new Set(completedIds);
  return lessons.find((l) => !done.has(l.id)) ?? null;
}

export async function nextLessonFor(userId: string, courseId: string): Promise<CurriculumLesson | null> {
  const { lessons } = await getCurriculum(courseId);
  return firstIncomplete(lessons, await completedLessonIds(userId, courseId));
}

export type StudentCourse = {
  course: Course;
  progress: CourseProgress;
  /** Where "Continue" should go: the next incomplete lesson, or the first lesson once finished. */
  continueLesson: CurriculumLesson | null;
  enrolledAt: Date;
  totalMinutes: number;
};

/** Every course a student is enrolled in (published or not — they bought it), most recent first. */
export async function getStudentCourses(userId: string): Promise<StudentCourse[]> {
  const db = await getDb();
  const rows = await db
    .select({ course: schema.courses, enrolledAt: schema.enrollments.createdAt })
    .from(schema.enrollments)
    .innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId))
    .where(eq(schema.enrollments.userId, userId))
    .orderBy(asc(schema.enrollments.createdAt));
  const out: StudentCourse[] = [];
  for (const { course, enrolledAt } of rows) {
    const { lessons } = await getCurriculum(course.id);
    const progress = progressFrom(lessons, await completedLessonIds(userId, course.id));
    out.push({
      course,
      progress,
      continueLesson: firstIncomplete(lessons, progress.completedLessonIds) ?? lessons[0] ?? null,
      enrolledAt,
      totalMinutes: lessons.reduce((s, l) => s + l.durationMin, 0),
    });
  }
  return out.reverse();
}

/** Published courses the student doesn't own yet — matched to their interest segment first. */
export async function recommendedCoursesFor(user: Pick<User, "id" | "contactId">, limit = 3): Promise<CourseSummary[]> {
  const db = await getDb();
  const owned = await db
    .select({ courseId: schema.enrollments.courseId })
    .from(schema.enrollments)
    .where(eq(schema.enrollments.userId, user.id));
  const ownedIds = new Set(owned.map((o) => o.courseId));
  let segment: string | null = null;
  if (user.contactId) {
    const [c] = await db.select({ segment: schema.contacts.segment }).from(schema.contacts).where(eq(schema.contacts.id, user.contactId)).limit(1);
    segment = c?.segment ?? null;
  }
  const available = (await listPublishedCourses()).filter((c) => !ownedIds.has(c.id));
  const rank = (c: CourseSummary) => (segment && segment !== "both" && (c.audience === segment || c.audience === "both") ? 0 : 1);
  return available.sort((a, b) => rank(a) - rank(b) || Number(b.featured) - Number(a.featured)).slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Enrollment                                                          */
/* ------------------------------------------------------------------ */

/** Grants a student access to a course (creates the student user if needed) and emails a login link. Idempotent. */
export async function enrollInCourse(input: {
  email: string;
  name?: string | null;
  courseId: string;
  source: "purchase" | "manual";
  orderId?: string | null;
  /** Send the "you're in" email with a magic sign-in link (default true). */
  sendAccessEmail?: boolean;
}): Promise<{ enrolled: boolean; userId: string }> {
  const db = await getDb();
  const email = normalizeEmail(input.email);
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, input.courseId)).limit(1);
  if (!course) throw new Error(`Course ${input.courseId} not found`);

  const user = await upsertStudent(email, input.name);

  // Make sure every student is a CRM contact (manual grants may be for brand-new people).
  let contactId = user.contactId;
  if (!contactId) {
    const { contact } = await upsertContact({
      email,
      name: input.name ?? user.name,
      source: input.source === "purchase" ? "checkout" : "manual",
    });
    contactId = contact.id;
    await db.update(schema.users).set({ contactId }).where(eq(schema.users.id, user.id));
  }
  if (!user.name && input.name?.trim()) {
    await db.update(schema.users).set({ name: input.name.trim() }).where(eq(schema.users.id, user.id));
  }

  const [inserted] = await db
    .insert(schema.enrollments)
    .values({ userId: user.id, courseId: course.id, source: input.source, orderId: input.orderId ?? null })
    .onConflictDoNothing()
    .returning();
  if (!inserted) return { enrolled: false, userId: user.id };

  if (input.source === "manual") {
    await logActivity(contactId, "note", `Given access to “${course.title}”`, { meta: { courseId: course.id, source: "manual" } });
  }

  if (input.sendAccessEmail !== false) {
    await sendCourseAccessEmail({ email, name: input.name ?? user.name, course, contactId });
  }
  return { enrolled: true, userId: user.id };
}

/** Emails a one-time sign-in link that lands the student straight in the course. Returns the link. */
export async function sendCourseAccessEmail(input: {
  email: string;
  name?: string | null;
  course: Pick<Course, "slug" | "title">;
  contactId?: string | null;
}): Promise<string> {
  const token = await createLoginToken(input.email, `/learn/${input.course.slug}`);
  const link = absoluteUrl(`/auth/verify?token=${encodeURIComponent(token)}`);
  const loginUrl = absoluteUrl("/login");
  await sendEmail({
    to: input.email,
    subject: `You're in: ${input.course.title}`,
    kind: "welcome",
    contactId: input.contactId ?? null,
    preheader: "Your course is ready — here's your sign-in link.",
    markdown: [
      `Hi ${firstName(input.name, input.email)},`,
      `Welcome to **${input.course.title}** — your access is ready.`,
      `**[Start learning →](${link})**`,
      `This one-click sign-in link works once and expires in 30 minutes. After that, you can always get a fresh link at ${loginUrl} using this email address — no password needed.`,
      `Inside every lesson there's an AI tutor you can ask questions about the material and how to apply it to your own work.`,
      `Glad to have you with us,  \nThe Principe AI team`,
    ].join("\n\n"),
  });
  return link;
}
