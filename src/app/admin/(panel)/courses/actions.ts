"use server";

import { and, asc, count, eq, gt, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { enrollInCourse } from "@/lib/courses";
import { PENDING_ORDER_TTL_MS } from "@/lib/jobs";
import { describeSync } from "@/lib/payment-links";
import { syncCoursePaymentLinks, syncCoursePaymentLinksLater } from "@/lib/payments";
import { rateLimit } from "@/lib/rate-limit";
import { parseVideoUrl } from "@/lib/video";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** What was submitted, echoed back on validation errors so uncontrolled forms can restore it after React's reset. */
  values?: Record<string, string>;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Lesson slugs that would collide with student-portal routes. */
const RESERVED_LESSON_SLUGS = new Set(["certificate"]);

const money = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, { error: "Enter an amount like 47 or 47.00" })
  .transform((v) => Math.round(Number(v) * 100));

const optionalMoney = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (!v) return null;
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(v)) {
      ctx.addIssue({ code: "custom", message: "Enter an amount like 97 or 97.00, or leave blank" });
      return z.NEVER;
    }
    return Math.round(Number(v) * 100);
  });

const lines = z
  .string()
  .max(10_000)
  .transform((v) =>
    v
      .split(/\r?\n/)
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 30),
  );

const faqsJson = z.string().transform((v, ctx) => {
  try {
    const parsed = z
      .array(z.object({ q: z.string().trim().max(300), a: z.string().trim().max(3000) }))
      .max(30)
      .parse(JSON.parse(v || "[]"));
    return parsed.filter((f) => f.q && f.a);
  } catch {
    ctx.addIssue({ code: "custom", message: "FAQs couldn't be read. Please check them and try again." });
    return z.NEVER;
  }
});

const uuid = z.uuid();

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function str(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

async function courseSlugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ id: schema.courses.id })
    .from(schema.courses)
    .where(exceptId ? and(eq(schema.courses.slug, slug), ne(schema.courses.id, exceptId)) : eq(schema.courses.slug, slug))
    .limit(1);
  return Boolean(row);
}

async function revalidateCourse(courseId: string) {
  const db = await getDb();
  const [c] = await db.select({ slug: schema.courses.slug }).from(schema.courses).where(eq(schema.courses.id, courseId)).limit(1);
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  if (c) revalidatePath(`/courses/${c.slug}`);
}

/** Rewrites positions as 0..n-1 in the given order. */
async function normalizePositions(table: "modules" | "lessons", ids: string[]) {
  const db = await getDb();
  for (const [position, id] of ids.entries()) {
    if (table === "modules") await db.update(schema.courseModules).set({ position }).where(eq(schema.courseModules.id, id));
    else await db.update(schema.lessons).set({ position }).where(eq(schema.lessons.id, id));
  }
}

/* ------------------------------------------------------------------ */
/* Courses                                                             */
/* ------------------------------------------------------------------ */

const createSchema = z.object({
  title: z.string().trim().min(3, { error: "Give the course a title (at least 3 characters)." }).max(160),
  price: money,
  audience: z.enum(["life", "business", "both"]),
});

export async function createCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const raw = { title: str(formData, "title"), price: str(formData, "price"), audience: str(formData, "audience") || "both" };
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };
  const { title, price, audience } = parsed.data;

  const base = slugify(title) || "course";
  let slug = base;
  for (let i = 2; await courseSlugTaken(slug); i++) slug = `${base}-${i}`;

  const db = await getDb();
  const [{ value: existing }] = await db.select({ value: count() }).from(schema.courses);
  const [course] = await db
    .insert(schema.courses)
    .values({ title, slug, priceCents: price, audience, published: false, sortOrder: existing, coverEmoji: "✨" })
    .returning({ id: schema.courses.id });
  await db.insert(schema.courseModules).values({ courseId: course.id, title: "Getting started", position: 0 });
  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}?created=1`);
}

const courseSchema = z.object({
  id: uuid,
  title: z.string().trim().min(3, { error: "Title must be at least 3 characters." }).max(160),
  slug: z.string().trim().max(80).regex(SLUG, { error: "Use lowercase letters, numbers and dashes only." }),
  subtitle: z.string().trim().max(240, { error: "Keep the subtitle under 240 characters." }),
  description: z.string().max(20_000),
  audience: z.enum(["life", "business", "both"]),
  level: z.string().trim().min(1, { error: "Choose a level." }).max(40),
  price: money,
  compareAt: optionalMoney,
  coverEmoji: z.string().trim().min(1, { error: "Pick an emoji for the cover." }).max(16),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  outcomes: lines,
  includes: lines,
  faqs: faqsJson,
});

export async function updateCourseAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const title = str(formData, "title");
  const parsed = courseSchema.safeParse({
    id: str(formData, "id"),
    title,
    slug: str(formData, "slug").trim() || slugify(title),
    subtitle: str(formData, "subtitle"),
    description: str(formData, "description"),
    audience: str(formData, "audience"),
    level: str(formData, "level"),
    price: str(formData, "price"),
    compareAt: str(formData, "compareAt"),
    coverEmoji: str(formData, "coverEmoji"),
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    sortOrder: str(formData, "sortOrder") || "0",
    outcomes: str(formData, "outcomes"),
    includes: str(formData, "includes"),
    faqs: str(formData, "faqs"),
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  if (d.compareAt !== null && d.compareAt <= d.price) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { compareAt: "The compare-at price should be higher than the price (or blank)." } };
  }
  if (await courseSlugTaken(d.slug, d.id)) {
    return { error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another course already uses this URL." } };
  }

  const db = await getDb();
  const [before] = await db.select({ slug: schema.courses.slug }).from(schema.courses).where(eq(schema.courses.id, d.id)).limit(1);
  if (!before) return { error: "This course no longer exists." };
  await db
    .update(schema.courses)
    .set({
      title: d.title,
      slug: d.slug,
      subtitle: d.subtitle,
      description: d.description,
      audience: d.audience,
      level: d.level,
      priceCents: d.price,
      compareAtCents: d.compareAt,
      coverEmoji: d.coverEmoji,
      featured: d.featured,
      published: d.published,
      sortOrder: d.sortOrder,
      outcomes: d.outcomes,
      includes: d.includes,
      faqs: d.faqs,
    })
    .where(eq(schema.courses.id, d.id));
  if (before.slug !== d.slug) revalidatePath(`/courses/${before.slug}`);
  await revalidateCourse(d.id);
  // Price, title or status may have changed: the Stripe payment link follows.
  syncCoursePaymentLinksLater();
  return { ok: true, message: "Course saved." };
}

export async function toggleCoursePublishedAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("id"));
  const db = await getDb();
  await db.update(schema.courses).set({ published: sql`not ${schema.courses.published}` }).where(eq(schema.courses.id, id));
  await revalidateCourse(id);
  syncCoursePaymentLinksLater();
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("id"));
  const db = await getDb();
  const [{ value: students }] = await db.select({ value: count() }).from(schema.enrollments).where(eq(schema.enrollments.courseId, id));
  const [{ value: paid }] = await db
    .select({ value: count() })
    .from(schema.orders)
    .where(and(eq(schema.orders.courseId, id), eq(schema.orders.status, "paid")));
  if (students > 0 || paid > 0) redirect(`/admin/courses/${id}?error=has-students`);
  // Deleting would orphan an open Stripe checkout (orders.course_id is set null), leaving a payment undeliverable.
  const [{ value: open }] = await db
    .select({ value: count() })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.courseId, id),
        eq(schema.orders.status, "pending"),
        gt(schema.orders.createdAt, new Date(Date.now() - PENDING_ORDER_TTL_MS)),
      ),
    );
  if (open > 0) redirect(`/admin/courses/${id}?error=open-checkouts`);
  await db.delete(schema.courses).where(eq(schema.courses.id, id));
  // Its Stripe payment link stops selling.
  syncCoursePaymentLinksLater();
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect("/admin/courses?deleted=1");
}

export type PaymentLinkSyncState = { ok: true; message: string; details: string[] } | { ok: false; error: string; details?: string[] };

/** Admin → Courses → "Sync with Stripe": creates or updates every paid course's Stripe payment link now. */
export async function syncPaymentLinksAction(): Promise<PaymentLinkSyncState> {
  const session = await assertAdmin();
  const limit = await rateLimit(`admin-payment-links:${session.email}`, 10, 600);
  if (!limit.ok) return { ok: false, error: "That's a lot of syncs in a few minutes. Please wait a little and try again." };
  try {
    const result = await syncCoursePaymentLinks();
    if (!result) return { ok: false, error: "Stripe isn't connected. Add STRIPE_SECRET_KEY in your Vercel environment variables, then redeploy." };
    revalidatePath("/admin/courses");
    const details = describeSync(result);
    if (result.errors.length) return { ok: false, error: `Synced with ${result.errors.length} problem${result.errors.length === 1 ? "" : "s"}.`, details };
    const live = result.courses.filter((c) => c.url).length;
    return { ok: true, message: `Payment links are up to date for ${live} course${live === 1 ? "" : "s"}.`, details };
  } catch (err) {
    console.error("[courses] payment-link sync failed", err);
    return { ok: false, error: `Stripe sync failed: ${err instanceof Error ? err.message : "unknown error"}` };
  }
}

/* ------------------------------------------------------------------ */
/* Modules                                                             */
/* ------------------------------------------------------------------ */

const moduleTitle = z.string().trim().min(1, { error: "Module title is required." }).max(160);

export async function addModuleAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const courseId = uuid.parse(formData.get("courseId"));
  const title = moduleTitle.parse(str(formData, "title"));
  const db = await getDb();
  const [{ value: n }] = await db.select({ value: count() }).from(schema.courseModules).where(eq(schema.courseModules.courseId, courseId));
  await db.insert(schema.courseModules).values({ courseId, title, position: n });
  await revalidateCourse(courseId);
}

export async function renameModuleAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("moduleId"));
  const title = moduleTitle.parse(str(formData, "title"));
  const db = await getDb();
  const [m] = await db.update(schema.courseModules).set({ title }).where(eq(schema.courseModules.id, id)).returning();
  if (m) await revalidateCourse(m.courseId);
}

export async function moveModuleAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("moduleId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const db = await getDb();
  const [m] = await db.select().from(schema.courseModules).where(eq(schema.courseModules.id, id)).limit(1);
  if (!m) return;
  const siblings = await db
    .select({ id: schema.courseModules.id })
    .from(schema.courseModules)
    .where(eq(schema.courseModules.courseId, m.courseId))
    .orderBy(asc(schema.courseModules.position), asc(schema.courseModules.title));
  const ids = siblings.map((s) => s.id);
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await normalizePositions("modules", ids);
  await revalidateCourse(m.courseId);
}

export async function deleteModuleAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("moduleId"));
  const db = await getDb();
  const [m] = await db.delete(schema.courseModules).where(eq(schema.courseModules.id, id)).returning();
  if (!m) return;
  const rest = await db
    .select({ id: schema.courseModules.id })
    .from(schema.courseModules)
    .where(eq(schema.courseModules.courseId, m.courseId))
    .orderBy(asc(schema.courseModules.position));
  await normalizePositions("modules", rest.map((r) => r.id));
  await revalidateCourse(m.courseId);
}

/* ------------------------------------------------------------------ */
/* Lessons                                                             */
/* ------------------------------------------------------------------ */

const lessonSchema = z.object({
  lessonId: uuid.optional(),
  courseId: uuid,
  moduleId: uuid,
  title: z.string().trim().min(2, { error: "Give the lesson a title." }).max(200),
  slug: z
    .string()
    .trim()
    .max(80)
    .regex(SLUG, { error: "Use lowercase letters, numbers and dashes only." })
    .refine((s) => !RESERVED_LESSON_SLUGS.has(s), { error: "This URL is reserved. Please choose another." }),
  summary: z.string().trim().max(400, { error: "Keep the summary under 400 characters." }),
  content: z.string().max(100_000, { error: "This lesson is too long — split it into two lessons." }),
  videoUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || parseVideoUrl(v) !== null, { error: "Use a YouTube, Vimeo or Loom link (or leave blank)." }),
  durationMin: z.coerce.number().int().min(1, { error: "At least 1 minute." }).max(600, { error: "Keep lessons under 10 hours." }),
  isPreview: z.boolean(),
});

export async function saveLessonAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const title = str(formData, "title");
  const parsed = lessonSchema.safeParse({
    lessonId: str(formData, "lessonId") || undefined,
    courseId: str(formData, "courseId"),
    moduleId: str(formData, "moduleId"),
    title,
    slug: str(formData, "slug").trim() || slugify(title),
    summary: str(formData, "summary"),
    content: str(formData, "content"),
    videoUrl: str(formData, "videoUrl"),
    durationMin: str(formData, "durationMin") || "10",
    isPreview: formData.get("isPreview") === "on",
  });
  if (!parsed.success) return { error: "Please fix the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  const d = parsed.data;
  const db = await getDb();

  const [mod] = await db
    .select()
    .from(schema.courseModules)
    .where(and(eq(schema.courseModules.id, d.moduleId), eq(schema.courseModules.courseId, d.courseId)))
    .limit(1);
  if (!mod) return { error: "Please choose a module from this course.", fieldErrors: { moduleId: "Choose a module." } };

  const [clash] = await db
    .select({ id: schema.lessons.id })
    .from(schema.lessons)
    .where(
      and(
        eq(schema.lessons.courseId, d.courseId),
        eq(schema.lessons.slug, d.slug),
        d.lessonId ? ne(schema.lessons.id, d.lessonId) : undefined,
      ),
    )
    .limit(1);
  if (clash) return { error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another lesson in this course already uses this URL." } };

  const values = {
    moduleId: d.moduleId,
    title: d.title,
    slug: d.slug,
    summary: d.summary,
    content: d.content,
    videoUrl: d.videoUrl || null,
    durationMin: d.durationMin,
    isPreview: d.isPreview,
  };

  if (d.lessonId) {
    const [existing] = await db
      .select({ moduleId: schema.lessons.moduleId })
      .from(schema.lessons)
      .where(and(eq(schema.lessons.id, d.lessonId), eq(schema.lessons.courseId, d.courseId)))
      .limit(1);
    if (!existing) return { error: "This lesson no longer exists." };
    let position: number | undefined;
    if (existing.moduleId !== d.moduleId) {
      // Moving to another module: append at the end.
      const [{ value: n }] = await db.select({ value: count() }).from(schema.lessons).where(eq(schema.lessons.moduleId, d.moduleId));
      position = n;
    }
    await db
      .update(schema.lessons)
      .set({ ...values, ...(position !== undefined ? { position } : {}) })
      .where(eq(schema.lessons.id, d.lessonId));
    await revalidateCourse(d.courseId);
    return { ok: true, message: "Lesson saved." };
  }

  const [{ value: n }] = await db.select({ value: count() }).from(schema.lessons).where(eq(schema.lessons.moduleId, d.moduleId));
  const [created] = await db
    .insert(schema.lessons)
    .values({ ...values, courseId: d.courseId, position: n })
    .returning({ id: schema.lessons.id });
  await revalidateCourse(d.courseId);
  redirect(`/admin/courses/${d.courseId}/lessons/${created.id}?created=1`);
}

export async function moveLessonAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("lessonId"));
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const db = await getDb();
  const [l] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, id)).limit(1);
  if (!l) return;
  const siblings = await db
    .select({ id: schema.lessons.id })
    .from(schema.lessons)
    .where(eq(schema.lessons.moduleId, l.moduleId))
    .orderBy(asc(schema.lessons.position), asc(schema.lessons.title));
  const ids = siblings.map((s) => s.id);
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await normalizePositions("lessons", ids);
  await revalidateCourse(l.courseId);
}

export async function deleteLessonAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = uuid.parse(formData.get("lessonId"));
  const db = await getDb();
  const [l] = await db.delete(schema.lessons).where(eq(schema.lessons.id, id)).returning();
  if (!l) return;
  const rest = await db
    .select({ id: schema.lessons.id })
    .from(schema.lessons)
    .where(eq(schema.lessons.moduleId, l.moduleId))
    .orderBy(asc(schema.lessons.position));
  await normalizePositions("lessons", rest.map((r) => r.id));
  await revalidateCourse(l.courseId);
  if (formData.get("redirect") === "1") redirect(`/admin/courses/${l.courseId}?tab=curriculum`);
}

/* ------------------------------------------------------------------ */
/* Student access                                                      */
/* ------------------------------------------------------------------ */

const grantSchema = z.object({
  courseId: uuid,
  email: z.email({ error: "Enter a valid email address." }).max(254),
  name: z.string().trim().max(120),
  sendEmail: z.boolean(),
});

export async function grantAccessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await assertAdmin();
  const raw = { email: str(formData, "email"), name: str(formData, "name"), sendEmail: formData.get("sendEmail") === "on" ? "on" : "" };
  const parsed = grantSchema.safeParse({
    courseId: str(formData, "courseId"),
    email: raw.email.trim().toLowerCase(),
    name: raw.name,
    sendEmail: raw.sendEmail === "on",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };
  const { courseId, email, name, sendEmail } = parsed.data;
  try {
    const { enrolled } = await enrollInCourse({ email, name: name || null, courseId, source: "manual", sendAccessEmail: sendEmail });
    revalidatePath(`/admin/courses/${courseId}`);
    if (!enrolled) return { ok: true, message: `${email} already has access to this course.` };
    return { ok: true, message: sendEmail ? `Access granted — a sign-in link was emailed to ${email}.` : `Access granted to ${email}.` };
  } catch (err) {
    console.error("[admin] grant access failed", err);
    return { error: "Couldn't grant access. Please try again.", values: raw };
  }
}

export async function revokeAccessAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const courseId = uuid.parse(formData.get("courseId"));
  const userId = uuid.parse(formData.get("userId"));
  const db = await getDb();
  await db.delete(schema.enrollments).where(and(eq(schema.enrollments.courseId, courseId), eq(schema.enrollments.userId, userId)));
  revalidatePath(`/admin/courses/${courseId}`);
}
