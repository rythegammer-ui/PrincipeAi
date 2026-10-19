"use server";

import { and, count, eq, gte, inArray, lt, ne } from "drizzle-orm";
import { DateTime } from "luxon";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { MEETING_COLOR_NAMES } from "@/components/booking/meeting-colors";
import { getDb, schema } from "@/db";
import { assertAdmin } from "@/lib/auth";
import { refreshPrepTasks } from "@/lib/booking-service";
import { getBusinessTimezone, isBuiltInMeetingSlug, MAX_BUFFER_MIN } from "@/lib/scheduling";
import { slugify } from "@/lib/utils";

export type SchedulingFormState = { error?: string; fieldErrors?: Record<string, string>; message?: string };

const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
};

function revalidateScheduling(slug?: string) {
  revalidatePath("/admin/scheduling");
  revalidatePath("/admin/bookings");
  revalidatePath("/book");
  if (slug) revalidatePath(`/book/${slug}`);
}

/* ------------------------------------------------------------------ */
/* Meeting types                                                       */
/* ------------------------------------------------------------------ */

const intField = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} must be a whole number.`)
    .transform(Number)
    .refine((n) => n >= min && n <= max, `${label} must be between ${min} and ${max}.`);

const QuestionsInput = z
  .array(
    z.object({
      id: z.string().max(60).optional(),
      label: z.string().trim().min(1, "Every question needs a label.").max(200, "Questions must be under 200 characters."),
      required: z.boolean(),
    }),
  )
  .max(10, "Use at most 10 questions.");

const MeetingTypeInput = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  name: z.string().trim().min(2, "Give the meeting type a name.").max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "Use lowercase letters, numbers and single dashes."),
  description: z.string().trim().max(1000, "Keep the description under 1,000 characters."),
  durationMin: intField("Duration", 5, 480),
  price: z
    .string()
    .trim()
    .regex(/^(\d{1,6}(\.\d{1,2})?)?$/, "Enter a price like 150 or 149.99 (0 for free).")
    .transform((v) => Math.round(Number(v || "0") * 100)),
  locationLabel: z.string().trim().min(1, "Add a location label, e.g. Zoom.").max(80),
  locationUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => !v || /^https:\/\/[^\s]+$/i.test(v), "Use a full https:// link, or leave blank."),
  bufferMin: intField("Buffer", 0, MAX_BUFFER_MIN),
  minNoticeHours: intField("Minimum notice", 0, 720),
  maxDaysAhead: intField("Booking window", 1, 365),
  color: z.enum(MEETING_COLOR_NAMES),
  sortOrder: intField("Sort order", 0, 1000),
});

/** Stable, unique ids for intake questions (answers are stored by id). */
function normalizeQuestions(questions: z.infer<typeof QuestionsInput>) {
  const used = new Set<string>();
  return questions.map((q) => {
    let id = q.id && /^[a-z0-9_]{1,40}$/.test(q.id) ? q.id : slugify(q.label).replace(/-/g, "_").slice(0, 32) || "question";
    const base = id;
    for (let n = 2; used.has(id); n++) id = `${base}_${n}`;
    used.add(id);
    return { id, label: q.label, required: q.required };
  });
}

export async function saveMeetingTypeAction(_prev: SchedulingFormState, formData: FormData): Promise<SchedulingFormState> {
  await assertAdmin();
  const parsed = MeetingTypeInput.safeParse({
    id: str(formData, "id"),
    name: str(formData, "name"),
    slug: str(formData, "slug"),
    description: str(formData, "description"),
    durationMin: str(formData, "durationMin"),
    price: str(formData, "price"),
    locationLabel: str(formData, "locationLabel"),
    locationUrl: str(formData, "locationUrl"),
    bufferMin: str(formData, "bufferMin"),
    minNoticeHours: str(formData, "minNoticeHours"),
    maxDaysAhead: str(formData, "maxDaysAhead"),
    color: str(formData, "color"),
    sortOrder: str(formData, "sortOrder") || "0",
  });
  let rawQuestions: unknown = [];
  try {
    rawQuestions = JSON.parse(str(formData, "questions") || "[]");
  } catch {
    return { error: "The intake questions couldn't be read. Please try again." };
  }
  const questions = QuestionsInput.safeParse(rawQuestions);
  const fieldErrors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  if (!questions.success) fieldErrors.questions = questions.error.issues[0]?.message ?? "Check the intake questions.";
  if (!parsed.success || !questions.success) return { error: "Please fix the highlighted fields.", fieldErrors };

  const input = parsed.data;
  const slug = input.slug || slugify(input.name);
  if (!slug) return { error: "Please fix the highlighted fields.", fieldErrors: { slug: "Add a URL slug." } };

  const db = await getDb();
  let prev: { slug: string; locationUrl: string | null } | undefined;
  if (input.id) {
    [prev] = await db
      .select({ slug: schema.meetingTypes.slug, locationUrl: schema.meetingTypes.locationUrl })
      .from(schema.meetingTypes)
      .where(eq(schema.meetingTypes.id, input.id))
      .limit(1);
    if (!prev) return { error: "This meeting type no longer exists." };
    if (prev.slug !== slug && isBuiltInMeetingSlug(prev.slug)) {
      return {
        error: "Please fix the highlighted fields.",
        fieldErrors: { slug: `The site's funnels (home page, consulting, assessment) link to /book/${prev.slug}, so this URL can't be changed.` },
      };
    }
  }
  const [clash] = await db
    .select({ id: schema.meetingTypes.id })
    .from(schema.meetingTypes)
    .where(input.id ? and(eq(schema.meetingTypes.slug, slug), ne(schema.meetingTypes.id, input.id)) : eq(schema.meetingTypes.slug, slug))
    .limit(1);
  if (clash) return { error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another meeting type already uses this URL." } };

  const values = {
    name: input.name,
    slug,
    description: input.description,
    durationMin: input.durationMin,
    priceCents: input.price,
    locationLabel: input.locationLabel,
    locationUrl: input.locationUrl || null,
    bufferMin: input.bufferMin,
    minNoticeHours: input.minNoticeHours,
    maxDaysAhead: input.maxDaysAhead,
    questions: normalizeQuestions(questions.data),
    color: input.color,
    active: formData.get("active") === "on",
    sortOrder: input.sortOrder,
  };

  if (input.id && prev) {
    await db.update(schema.meetingTypes).set(values).where(eq(schema.meetingTypes.id, input.id));
    revalidateScheduling(prev.slug);
    // A meeting link added (or removed): the prep tasks of upcoming calls stop (or start) saying one is missing.
    if ((prev.locationUrl?.trim() || null) !== values.locationUrl) {
      const id = input.id;
      await refreshPrepTasks(id).catch((err) => console.error("[scheduling] prep task refresh failed", id, err));
    }
  } else {
    await db.insert(schema.meetingTypes).values(values);
  }
  revalidateScheduling(slug);
  redirect(`/admin/scheduling?saved=${encodeURIComponent(input.name.slice(0, 80))}`);
}

export async function deleteMeetingTypeAction(_prev: SchedulingFormState, formData: FormData): Promise<SchedulingFormState> {
  await assertAdmin();
  const id = z.uuid().safeParse(str(formData, "id"));
  if (!id.success) return { error: "Invalid meeting type." };
  const db = await getDb();
  const [mt] = await db.select().from(schema.meetingTypes).where(eq(schema.meetingTypes.id, id.data)).limit(1);
  if (!mt) redirect("/admin/scheduling");
  const [{ n }] = await db.select({ n: count() }).from(schema.bookings).where(eq(schema.bookings.meetingTypeId, mt.id));
  if (n > 0) {
    // Bookings reference this type, so keep it for history and just hide it from the booking page.
    await db.update(schema.meetingTypes).set({ active: false }).where(eq(schema.meetingTypes.id, mt.id));
    revalidateScheduling(mt.slug);
    return { message: `This meeting type has ${n} booking${n === 1 ? "" : "s"}, so it was hidden from your booking page instead of deleted.` };
  }
  await db.delete(schema.meetingTypes).where(eq(schema.meetingTypes.id, mt.id));
  revalidateScheduling(mt.slug);
  redirect(`/admin/scheduling?deleted=${encodeURIComponent(mt.name.slice(0, 80))}`);
}

/* ------------------------------------------------------------------ */
/* Weekly availability                                                 */
/* ------------------------------------------------------------------ */

const RulesInput = z
  .array(
    z
      .object({
        weekday: z.number().int().min(1).max(7),
        startMinute: z.number().int().min(0).max(1439),
        endMinute: z.number().int().min(1).max(1440),
      })
      .refine((r) => r.endMinute > r.startMinute, "Each time range must end after it starts."),
  )
  .max(70, "That's too many time ranges.");

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export async function saveAvailabilityAction(_prev: SchedulingFormState, formData: FormData): Promise<SchedulingFormState> {
  await assertAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(str(formData, "rules") || "[]");
  } catch {
    return { error: "Your hours couldn't be read. Please try again." };
  }
  const parsed = RulesInput.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your hours." };
  const rules = [...parsed.data].sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
  for (let i = 1; i < rules.length; i++) {
    const prev = rules[i - 1];
    const cur = rules[i];
    if (prev.weekday === cur.weekday && cur.startMinute < prev.endMinute) {
      return { error: `${DAY_NAMES[cur.weekday]} has overlapping time ranges. Adjust them so they don't overlap.` };
    }
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.availabilityRules);
    if (rules.length) await tx.insert(schema.availabilityRules).values(rules);
  });
  revalidateScheduling();
  return { message: rules.length ? "Weekly hours saved. Your booking page is up to date." : "Saved. You have no weekly hours, so nobody can book until you add some." };
}

/* ------------------------------------------------------------------ */
/* Blocked dates                                                       */
/* ------------------------------------------------------------------ */

const BlockedInput = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date.")
    .refine((v) => DateTime.fromISO(v).isValid, "Pick a valid date."),
  reason: z.string().trim().max(200, "Keep the reason under 200 characters."),
});

export async function addBlockedDateAction(_prev: SchedulingFormState, formData: FormData): Promise<SchedulingFormState> {
  await assertAdmin();
  const parsed = BlockedInput.safeParse({ date: str(formData, "date"), reason: str(formData, "reason") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check the date." };
  const { date, reason } = parsed.data;
  const db = await getDb();
  const [existing] = await db.select({ id: schema.blockedDates.id }).from(schema.blockedDates).where(eq(schema.blockedDates.date, date)).limit(1);
  if (existing) return { error: "That date is already blocked." };
  await db.insert(schema.blockedDates).values({ date, reason: reason || null });

  // Existing bookings aren't cancelled automatically — point them out.
  const tz = await getBusinessTimezone();
  const dayStart = DateTime.fromISO(date, { zone: tz }).startOf("day");
  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.bookings)
    .where(
      and(
        inArray(schema.bookings.status, ["confirmed", "pending_payment"]),
        gte(schema.bookings.startAt, dayStart.toJSDate()),
        lt(schema.bookings.startAt, dayStart.plus({ days: 1 }).toJSDate()),
      ),
    );
  revalidateScheduling();
  const label = dayStart.toFormat("cccc, LLLL d");
  return {
    message:
      n > 0
        ? `${label} is blocked. Heads up: ${n} existing booking${n === 1 ? " is" : "s are"} on that day and ${n === 1 ? "wasn't" : "weren't"} cancelled. Review ${n === 1 ? "it" : "them"} in Bookings.`
        : `${label} is blocked. No new bookings can be made that day.`,
  };
}

export async function removeBlockedDateAction(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = z.uuid().safeParse(str(formData, "id"));
  if (!id.success) return;
  const db = await getDb();
  await db.delete(schema.blockedDates).where(eq(schema.blockedDates.id, id.data));
  revalidateScheduling();
}
