import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Shared value types                                                  */
/* ------------------------------------------------------------------ */

/** CRM pipeline stages, in funnel order. */
export const STAGES = [
  "new",
  "engaged",
  "qualified",
  "call_booked",
  "proposal",
  "customer",
  "lost",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  new: "New Lead",
  engaged: "Engaged",
  qualified: "Qualified",
  call_booked: "Call Booked",
  proposal: "Proposal Sent",
  customer: "Customer",
  lost: "Lost",
};

/** Activity types shown on the contact timeline. */
export type ActivityType =
  | "created"
  | "optin"
  | "quiz_completed"
  | "booking_created"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "purchase"
  | "email_sent"
  | "chat"
  | "note"
  | "call"
  | "stage_changed"
  | "task"
  | "form"
  | "login"
  | "lesson_completed"
  | "ai";

export type UtmParams = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
};

export type BookingStatus = "pending_payment" | "confirmed" | "cancelled" | "completed" | "no_show";
export type OrderStatus = "pending" | "paid" | "refunded" | "failed" | "expired";
export type EmailStatus = "sent" | "simulated" | "failed" | "skipped";
export type SequenceTrigger = "lead_magnet" | "quiz_completed" | "call_booked" | "purchase" | "contact_form" | "manual";
export type EnrollmentStatus = "active" | "completed" | "stopped";

export type ChatMessage = { role: "user" | "assistant"; content: string; at: string };

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* CRM                                                                 */
/* ------------------------------------------------------------------ */

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Always stored lowercased + trimmed. */
    email: text("email").notNull(),
    name: text("name"),
    phone: text("phone"),
    company: text("company"),
    website: text("website"),
    stage: text("stage").$type<Stage>().notNull().default("new"),
    /** Lead score 0-100, recomputed by lib/crm.ts recomputeScore(). */
    score: integer("score").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    /** First-touch acquisition source, e.g. "lead_magnet", "assessment", "booking", "chat", "checkout", "contact_form", "manual". */
    source: text("source"),
    utm: jsonb("utm").$type<UtmParams>().notNull().default(sql`'{}'::jsonb`),
    referrer: text("referrer"),
    landingPage: text("landing_page"),
    visitorId: text("visitor_id"),
    /** Interest segment: "life" (personal productivity) | "business" | "both". */
    segment: text("segment"),
    /** Estimated deal value in cents (for pipeline). */
    dealValueCents: integer("deal_value_cents").notNull().default(0),
    /** Sum of paid orders in cents. */
    lifetimeValueCents: integer("lifetime_value_cents").notNull().default(0),
    notes: text("notes"),
    aiSummary: text("ai_summary"),
    aiSummaryAt: timestamp("ai_summary_at", { withTimezone: true }),
    unsubscribed: boolean("unsubscribed").notNull().default(false),
    /** Token for one-click unsubscribe links. */
    unsubscribeToken: text("unsubscribe_token").notNull().default(sql`replace(gen_random_uuid()::text, '-', '')`),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("contacts_email_idx").on(t.email),
    index("contacts_stage_idx").on(t.stage),
    index("contacts_created_idx").on(t.createdAt),
    index("contacts_visitor_idx").on(t.visitorId),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    type: text("type").$type<ActivityType>().notNull(),
    title: text("title").notNull(),
    body: text("body"),
    meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_contact_idx").on(t.contactId, t.createdAt)],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    priority: text("priority").$type<"low" | "normal" | "high">().notNull().default("normal"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** "manual" or the automation that created it, e.g. "booking", "quiz_hot_lead". */
    origin: text("origin").notNull().default("manual"),
    ...timestamps,
  },
  (t) => [index("tasks_due_idx").on(t.completedAt, t.dueAt)],
);

/* ------------------------------------------------------------------ */
/* Funnel analytics                                                    */
/* ------------------------------------------------------------------ */

/**
 * Event names (keep in sync with src/lib/funnels.ts):
 * page_view, optin, quiz_started, quiz_completed, booking_viewed, booking_created,
 * checkout_started, purchase, chat_started, chat_lead, contact_form, guide_viewed, cta_click
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: text("visitor_id").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    path: text("path"),
    referrer: text("referrer"),
    utm: jsonb("utm").$type<UtmParams>().notNull().default(sql`'{}'::jsonb`),
    props: jsonb("props").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_name_created_idx").on(t.name, t.createdAt),
    index("events_visitor_idx").on(t.visitorId),
    index("events_contact_idx").on(t.contactId),
  ],
);

/* ------------------------------------------------------------------ */
/* Email                                                               */
/* ------------------------------------------------------------------ */

export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    to: text("to").notNull(),
    subject: text("subject").notNull(),
    html: text("html").notNull(),
    /** e.g. "welcome", "booking_confirmation", "sequence", "magic_link", "receipt", "manual". */
    kind: text("kind").notNull(),
    status: text("status").$type<EmailStatus>().notNull(),
    providerId: text("provider_id"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_log_created_idx").on(t.createdAt), index("email_log_contact_idx").on(t.contactId)],
);

export const emailSequences = pgTable("email_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: text("trigger").$type<SequenceTrigger>().notNull(),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const sequenceSteps = pgTable(
  "sequence_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => emailSequences.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    /** Hours to wait after the previous step (or after enrollment for step 0). */
    delayHours: integer("delay_hours").notNull().default(24),
    subject: text("subject").notNull(),
    /** Markdown body. Supports {{name}}, {{firstName}}, {{siteUrl}}, {{bookUrl}} placeholders. */
    body: text("body").notNull(),
    ...timestamps,
  },
  (t) => [index("sequence_steps_seq_idx").on(t.sequenceId, t.position)],
);

export const sequenceEnrollments = pgTable(
  "sequence_enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sequenceId: uuid("sequence_id")
      .notNull()
      .references(() => emailSequences.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    /** Index of the next step to send. */
    nextStep: integer("next_step").notNull().default(0),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    status: text("status").$type<EnrollmentStatus>().notNull().default("active"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("sequence_enrollments_unique").on(t.sequenceId, t.contactId),
    index("sequence_enrollments_due_idx").on(t.status, t.nextRunAt),
  ],
);

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */

export const meetingTypes = pgTable(
  "meeting_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    durationMin: integer("duration_min").notNull().default(30),
    /** 0 = free. Paid meetings require Stripe checkout before they're confirmed. */
    priceCents: integer("price_cents").notNull().default(0),
    /** Video link (Zoom/Google Meet) shared after booking; blank = "we'll send a link". */
    locationUrl: text("location_url"),
    locationLabel: text("location_label").notNull().default("Video call"),
    bufferMin: integer("buffer_min").notNull().default(15),
    minNoticeHours: integer("min_notice_hours").notNull().default(12),
    maxDaysAhead: integer("max_days_ahead").notNull().default(30),
    /** Extra intake questions shown on the booking form. */
    questions: jsonb("questions").$type<{ id: string; label: string; required: boolean }[]>().notNull().default(sql`'[]'::jsonb`),
    color: text("color").notNull().default("violet"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("meeting_types_slug_idx").on(t.slug)],
);

/** Weekly recurring availability, interpreted in the business timezone (settings / site.timezone). */
export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** 1 = Monday ... 7 = Sunday (ISO / Luxon weekday). */
  weekday: integer("weekday").notNull(),
  /** Minutes from midnight, e.g. 540 = 09:00. */
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
});

/** Dates that are fully blocked (vacation, holidays) in the business timezone. */
export const blockedDates = pgTable("blocked_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** ISO date "YYYY-MM-DD". */
  date: text("date").notNull(),
  reason: text("reason"),
});

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    meetingTypeId: uuid("meeting_type_id")
      .notNull()
      .references(() => meetingTypes.id, { onDelete: "restrict" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    /** Invitee's IANA timezone (for emails / display). */
    timezone: text("timezone").notNull(),
    status: text("status").$type<BookingStatus>().notNull().default("confirmed"),
    answers: jsonb("answers").$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),
    notes: text("notes"),
    /** Secret for the public manage (cancel / reschedule) link. */
    manageToken: text("manage_token").notNull().default(sql`replace(gen_random_uuid()::text, '-', '')`),
    meetingUrl: text("meeting_url"),
    /** Pending-payment holds expire after this time. */
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    ...timestamps,
  },
  (t) => [
    index("bookings_start_idx").on(t.startAt),
    index("bookings_contact_idx").on(t.contactId),
    uniqueIndex("bookings_manage_token_idx").on(t.manageToken),
  ],
);

/* ------------------------------------------------------------------ */
/* Courses + students                                                  */
/* ------------------------------------------------------------------ */

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull().default(""),
    /** Markdown sales description. */
    description: text("description").notNull().default(""),
    /** "life" | "business" | "both" — used for recommendations. */
    audience: text("audience").notNull().default("both"),
    level: text("level").notNull().default("Beginner"),
    priceCents: integer("price_cents").notNull(),
    compareAtCents: integer("compare_at_cents"),
    /** Bullet list of outcomes shown on the sales page. */
    outcomes: jsonb("outcomes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    /** Bonus / "what's included" items. */
    includes: jsonb("includes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().notNull().default(sql`'[]'::jsonb`),
    /** Emoji or short glyph used as cover art when no image is set. */
    coverEmoji: text("cover_emoji").notNull().default("✨"),
    imageUrl: text("image_url"),
    published: boolean("published").notNull().default(true),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("courses_slug_idx").on(t.slug)],
);

export const courseModules = pgTable(
  "course_modules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("course_modules_course_idx").on(t.courseId, t.position)],
);

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => courseModules.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    /** Markdown lesson body. */
    content: text("content").notNull().default(""),
    /** Optional embeddable video URL (YouTube/Vimeo/Loom). */
    videoUrl: text("video_url"),
    durationMin: integer("duration_min").notNull().default(10),
    /** Free preview lessons are visible on the sales page without purchase. */
    isPreview: boolean("is_preview").notNull().default(false),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    uniqueIndex("lessons_course_slug_idx").on(t.courseId, t.slug),
    index("lessons_module_idx").on(t.moduleId, t.position),
  ],
);

/** Students (people who can log in to /learn). Admin access is env-based, not stored here. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/** Single-use magic-link login tokens (stored hashed). */
export const loginTokens = pgTable("login_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  /** Where to send the user after login. */
  redirectTo: text("redirect_to").notNull().default("/learn"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const enrollments = pgTable(
  "enrollments",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    /** "purchase" | "manual" | "bundle" */
    source: text("source").notNull().default("purchase"),
    orderId: uuid("order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    name: text("name"),
    /** "course" | "booking" */
    itemType: text("item_type").$type<"course" | "booking">().notNull(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
    bookingId: uuid("booking_id").references(() => bookings.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** true when completed through the built-in test checkout (no Stripe keys configured). */
    isTest: boolean("is_test").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("orders_created_idx").on(t.createdAt),
    uniqueIndex("orders_stripe_session_idx").on(t.stripeSessionId),
  ],
);

/* ------------------------------------------------------------------ */
/* AI + funnels                                                        */
/* ------------------------------------------------------------------ */

export const quizSubmissions = pgTable(
  "quiz_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<Record<string, string | string[]>>().notNull(),
    /** AI readiness score 0-100. */
    score: integer("score").notNull(),
    /** e.g. "explorer" | "experimenter" | "implementer" | "scaler" */
    tier: text("tier").notNull(),
    /** Recommended next offer: a course slug or "consulting" / "strategy-call". */
    recommendation: text("recommendation").notNull(),
    /** AI-generated personalised action plan (markdown). Null until generated. */
    plan: text("plan"),
    /** Secret used in the shareable results URL. */
    resultToken: text("result_token").notNull().default(sql`replace(gen_random_uuid()::text, '-', '')`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("quiz_result_token_idx").on(t.resultToken), index("quiz_contact_idx").on(t.contactId)],
);

export const chatConversations = pgTable(
  "chat_conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    visitorId: text("visitor_id").notNull(),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    /** "assistant" (site chat) | "tutor" (course AI tutor) */
    kind: text("kind").notNull().default("assistant"),
    messages: jsonb("messages").$type<ChatMessage[]>().notNull().default(sql`'[]'::jsonb`),
    /** Page where the chat started. */
    path: text("path"),
    ...timestamps,
  },
  (t) => [index("chat_visitor_idx").on(t.visitorId), index("chat_updated_idx").on(t.updatedAt)],
);

/** Key/value settings editable from /admin/settings. See src/lib/settings.ts for keys + defaults. */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Simple fixed-window rate limiting for public endpoints (AI chat, forms). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export type Contact = typeof contacts.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type MeetingType = typeof meetingTypes.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type CourseModule = typeof courseModules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type User = typeof users.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type EmailSequence = typeof emailSequences.$inferSelect;
export type SequenceStep = typeof sequenceSteps.$inferSelect;
