import "server-only";
import { and, asc, count, eq, gt, inArray, isNull, lt, lte, ne, notLike, or, sql } from "drizzle-orm";
import { getDb, schema, type DB } from "@/db";
import type { Booking, BookingStatus, Contact, MeetingType, Order } from "@/db/schema";
import { site } from "@/config/site";
import { stopAutomations } from "@/lib/automations";
import { captureLead, createTask, logActivity } from "@/lib/crm";
import { emailBusinessName, escapeMarkdown, notifyOwner, sendEmail } from "@/lib/email";
import { buildIcs, formatIcsDate, type IcsMethod } from "@/lib/ics";
import { rateLimit } from "@/lib/rate-limit";
import {
  bufferBetween,
  describeTime,
  formatDuration,
  formatMeetingTime,
  getBusinessTimezone,
  isSlotAvailable,
  MAX_BUFFER_MIN,
  occupiesSlot,
} from "@/lib/scheduling";
import { getSettings } from "@/lib/settings";
import { getStripe, paymentIntentId, stripeDashboardUrl, type Stripe } from "@/lib/stripe";
import { absoluteUrl, firstName, formatMoney } from "@/lib/utils";

/**
 * Booking lifecycle: reserving slots without double booking, confirmation side effects
 * (CRM, task, emails with ICS invites), paid confirmations, cancel / reschedule, and the
 * cron jobs (reminders, expired payment holds).
 * OWNER: scheduling feature. Other features call confirmPaidBooking / sendDueBookingReminders / releaseExpiredHolds.
 */

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** pg_advisory_xact_lock key that serializes every booking write (one calendar per business). */
export const BOOKING_LOCK_KEY = 7_204_311_118;
/** How long an unpaid booking holds its slot while the invitee is at checkout. */
export const PAYMENT_HOLD_MINUTES = 30;
/** Retrying checkout refreshes the hold, but never past this long after the booking was made. */
export const MAX_PAYMENT_HOLD_MINUTES = 2 * PAYMENT_HOLD_MINUTES;
export const HOLD_EXPIRED_REASON = "Payment not completed";
export const CHECKOUT_FAILED_REASON = "Checkout could not be started";
/** Set when the invitee releases their own unpaid hold to pick another time (never a booked call). */
export const CHANGED_BEFORE_PAYING_REASON = "Chose a different time before paying";
/** Set when payment arrives for a booking whose time is gone (owner follows up with a new time or refund). */
export const PAID_UNAVAILABLE_REASON = "Paid after the time was released";
const ICS_UID_DOMAIN = "principe.ai";

export type BookingDetails = { booking: Booking; meetingType: MeetingType; contact: Contact };
export type BookingEmailKind = "confirmation" | "reminder" | "rescheduled" | "cancelled";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{32}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);
export const isManageToken = (v: unknown): v is string => typeof v === "string" && TOKEN_RE.test(v);

/* ------------------------------------------------------------------ */
/* Loading                                                             */
/* ------------------------------------------------------------------ */

export async function getBookingDetails(by: { id: string } | { token: string }): Promise<BookingDetails | null> {
  if ("id" in by ? !isUuid(by.id) : !isManageToken(by.token)) return null;
  const db = await getDb();
  const [row] = await db
    .select({ booking: schema.bookings, meetingType: schema.meetingTypes, contact: schema.contacts })
    .from(schema.bookings)
    .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, schema.bookings.meetingTypeId))
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.bookings.contactId))
    .where("id" in by ? eq(schema.bookings.id, by.id) : eq(schema.bookings.manageToken, by.token))
    .limit(1);
  return row ?? null;
}

/** Can the invitee still cancel / reschedule this booking online? */
export function isChangeable(booking: Pick<Booking, "status" | "startAt">, now: Date = new Date()): boolean {
  return (booking.status === "confirmed" || booking.status === "pending_payment") && booking.startAt.getTime() > now.getTime();
}

/** A pending-payment booking whose hold has lapsed (whether or not the cron has released it yet). */
export function isHoldExpired(booking: Pick<Booking, "status" | "holdExpiresAt">, now: Date = new Date()): boolean {
  return booking.status === "pending_payment" && (!booking.holdExpiresAt || booking.holdExpiresAt.getTime() <= now.getTime());
}

/* ------------------------------------------------------------------ */
/* Double-booking protection                                           */
/* ------------------------------------------------------------------ */

async function withBookingLock<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  const db = await getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${sql.raw(String(BOOKING_LOCK_KEY))})`);
    return fn(tx);
  });
}

/**
 * True when a booking that occupies its slot sits within the buffer of [start, end). The gap kept is
 * the larger of the new meeting type's buffer and the existing booking's own type buffer.
 */
async function hasConflict(tx: Tx, start: Date, end: Date, bufferMin: number, excludeBookingId?: string): Promise<boolean> {
  // Candidates within the widest possible buffer; the exact per-booking gap is checked below.
  const widest = bufferBetween(bufferMin, MAX_BUFFER_MIN) * MINUTE_MS;
  const conds = [
    occupiesSlot(),
    lt(schema.bookings.startAt, new Date(end.getTime() + widest)),
    gt(schema.bookings.endAt, new Date(start.getTime() - widest)),
  ];
  if (excludeBookingId) conds.push(ne(schema.bookings.id, excludeBookingId));
  const rows = await tx
    .select({ startAt: schema.bookings.startAt, endAt: schema.bookings.endAt, bufferMin: schema.meetingTypes.bufferMin })
    .from(schema.bookings)
    .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, schema.bookings.meetingTypeId))
    .where(and(...conds));
  return rows.some((row) => {
    const gap = bufferBetween(bufferMin, row.bufferMin) * MINUTE_MS;
    return row.startAt.getTime() < end.getTime() + gap && row.endAt.getTime() > start.getTime() - gap;
  });
}

/**
 * Inserts a booking inside a transaction holding the global booking lock, after re-checking that
 * nothing (confirmed booking or live payment hold) overlaps it. Returns null when the slot was taken.
 */
export async function reserveSlot(input: {
  meetingType: MeetingType;
  contactId: string;
  start: Date;
  timezone: string;
  answers: Record<string, string>;
  notes?: string | null;
  paid: boolean;
}): Promise<Booking | null> {
  const { meetingType } = input;
  const end = new Date(input.start.getTime() + meetingType.durationMin * MINUTE_MS);
  const reminderHours = input.paid ? 0 : await reminderWindowHours();
  return withBookingLock(async (tx) => {
    if (await hasConflict(tx, input.start, end, meetingType.bufferMin)) return null;
    const [row] = await tx
      .insert(schema.bookings)
      .values({
        meetingTypeId: meetingType.id,
        contactId: input.contactId,
        startAt: input.start,
        endAt: end,
        timezone: input.timezone,
        status: input.paid ? "pending_payment" : "confirmed",
        answers: input.answers,
        notes: input.notes?.trim() || null,
        meetingUrl: meetingType.locationUrl?.trim() || null,
        holdExpiresAt: input.paid ? new Date(Date.now() + PAYMENT_HOLD_MINUTES * MINUTE_MS) : null,
        // Paid bookings get this when payment confirms them.
        reminderSentAt: input.paid ? null : reminderSentAtFor(input.start, reminderHours),
      })
      .returning();
    return row ?? null;
  });
}

/** Cancels an unpaid hold (e.g. when checkout can't be created). */
export async function releaseHold(bookingId: string, reason: string = CHECKOUT_FAILED_REASON): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason, holdExpiresAt: null })
    .where(and(eq(schema.bookings.id, bookingId), eq(schema.bookings.status, "pending_payment")));
}

type ClosedCheckout = { state: "closed" } | { state: "paid"; session: Stripe.Checkout.Session } | { state: "processing" };

/**
 * Makes sure an earlier checkout for a booking can no longer be paid, and marks its order expired.
 * Stripe refuses to expire a session that has already completed: paid while its webhook is late or
 * missing ("paid"), or paid with a delayed method such as a bank debit that is still clearing
 * ("processing"). Those orders stay pending for the webhook and the reconcile job. Throws when Stripe
 * can't confirm the session is closed, so callers never assume it is.
 */
async function closeCheckout(order: Pick<Order, "id" | "stripeSessionId">): Promise<ClosedCheckout> {
  const stripe = getStripe();
  const sessionId = order.stripeSessionId;
  if (stripe && sessionId?.startsWith("cs_")) {
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.expire(sessionId);
    } catch {
      // Expanded so a payment refunded in full is recognised (see prepareCheckoutRetry).
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent", "payment_intent.latest_charge"] });
    }
    if (session.status === "complete") {
      return session.payment_status === "unpaid" ? { state: "processing" } : { state: "paid", session };
    }
    if (session.status !== "expired") throw new Error(`Stripe checkout ${sessionId} could not be closed (${session.status})`);
  }
  const db = await getDb();
  await db
    .update(schema.orders)
    .set({ status: "expired" })
    .where(and(eq(schema.orders.id, order.id), eq(schema.orders.status, "pending")));
  return { state: "closed" };
}

async function openCheckouts(bookingId: string): Promise<Pick<Order, "id" | "stripeSessionId">[]> {
  const db = await getDb();
  return db
    .select({ id: schema.orders.id, stripeSessionId: schema.orders.stripeSessionId })
    .from(schema.orders)
    .where(and(eq(schema.orders.bookingId, bookingId), eq(schema.orders.status, "pending")));
}

/** Best effort, once a booking has been paid for: closes its other checkouts so they can't be paid as well. */
async function retireOpenCheckouts(bookingId: string): Promise<void> {
  try {
    for (const order of await openCheckouts(bookingId)) {
      // A session that completed meanwhile stays pending: its webhook fulfils it and alertDuplicatePayments flags it.
      await closeCheckout(order).catch((err) => console.error("[booking] could not close checkout", order.id, err));
    }
  } catch (err) {
    console.error("[booking] could not retire open checkouts", bookingId, err);
  }
}

/**
 * - `ok`: start a new checkout.
 * - `lapsed`: the hold has lapsed or the booking is no longer awaiting payment.
 * - `paid`: an earlier checkout had been paid after all (its webhook hadn't arrived); it's been fulfilled now.
 * - `processing`: an earlier checkout's delayed payment (e.g. a bank debit) is still clearing.
 */
export type CheckoutRetry = "ok" | "lapsed" | "paid" | "processing";

/**
 * Gets a still-held, unpaid booking ready for a fresh checkout (the invitee backed out of the first
 * one): refreshes the hold so it covers the new checkout session (capped at MAX_PAYMENT_HOLD_MINUTES
 * after booking), and closes the earlier checkouts so the same booking can't be paid twice. Only
 * `ok` allows a new checkout. Throws when Stripe can't confirm an earlier checkout is closed.
 */
export async function prepareCheckoutRetry(bookingId: string): Promise<CheckoutRetry> {
  if (!isUuid(bookingId)) return "lapsed";
  const now = new Date();
  const refreshed = await withBookingLock(async (tx) => {
    const [held] = await tx
      .select({ holdExpiresAt: schema.bookings.holdExpiresAt, createdAt: schema.bookings.createdAt })
      .from(schema.bookings)
      .where(and(eq(schema.bookings.id, bookingId), eq(schema.bookings.status, "pending_payment"), gt(schema.bookings.holdExpiresAt, now)))
      .limit(1);
    if (!held?.holdExpiresAt) return false;
    // A live hold already blocks its slot, so stretching it can't collide with another booking.
    const cap = held.createdAt.getTime() + MAX_PAYMENT_HOLD_MINUTES * MINUTE_MS;
    const until = Math.max(held.holdExpiresAt.getTime(), Math.min(now.getTime() + PAYMENT_HOLD_MINUTES * MINUTE_MS, cap));
    if (until > held.holdExpiresAt.getTime()) {
      await tx.update(schema.bookings).set({ holdExpiresAt: new Date(until) }).where(eq(schema.bookings.id, bookingId));
    }
    return true;
  });
  if (!refreshed) return "lapsed";

  const paid: { orderId: string; session: Stripe.Checkout.Session }[] = [];
  let processing = false;
  let failure: unknown = null;
  for (const order of await openCheckouts(bookingId)) {
    try {
      const closed = await closeCheckout(order);
      if (closed.state === "paid") paid.push({ orderId: order.id, session: closed.session });
      else if (closed.state === "processing") processing = true;
    } catch (err) {
      failure ??= err;
    }
  }
  if (paid.length) {
    // Imported lazily: payments imports this module.
    const { fulfillOrder, refundUndeliveredOrder, sessionFullyRefunded } = await import("@/lib/payments");
    let delivered = 0;
    for (const { orderId, session } of paid) {
      // Paid, then refunded in full before it was delivered: close it instead.
      if (sessionFullyRefunded(session)) {
        await refundUndeliveredOrder(orderId);
        continue;
      }
      await fulfillOrder(orderId, {
        stripePaymentIntentId: paymentIntentId(session.payment_intent),
        isTest: session.livemode === false,
        amountPaidCents: session.amount_total,
      });
      delivered++;
    }
    if (delivered) return "paid";
  }
  if (failure) throw failure;
  return processing ? "processing" : "ok";
}

/* ------------------------------------------------------------------ */
/* Links, ICS and email content                                        */
/* ------------------------------------------------------------------ */

export function manageUrl(booking: Pick<Booking, "manageToken">): string {
  return absoluteUrl(`/booking/${booking.manageToken}`);
}

export function icsDownloadUrl(booking: Pick<Booking, "manageToken">): string {
  return absoluteUrl(`/api/bookings/${booking.manageToken}/ics`);
}

export function meetingLinkFor(details: Pick<BookingDetails, "booking" | "meetingType">): string | null {
  return details.booking.meetingUrl?.trim() || details.meetingType.locationUrl?.trim() || null;
}

/** Bookings whose invitee gets the meeting link: never an unpaid hold or a cancelled booking. */
const JOIN_LINK_STATUSES: ReadonlySet<BookingStatus> = new Set<BookingStatus>(["confirmed", "completed", "no_show"]);

/** The meeting link to hand to the invitee (calendar invites and emails), once the booking is confirmed. */
export function joinLinkFor(details: Pick<BookingDetails, "booking" | "meetingType">): string | null {
  return JOIN_LINK_STATUSES.has(details.booking.status) ? meetingLinkFor(details) : null;
}

/** "Add to Google Calendar" template link. */
export function googleCalendarUrl(input: { title: string; start: Date; end: Date; details?: string; location?: string }): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${formatIcsDate(input.start)}/${formatIcsDate(input.end)}`,
  });
  if (input.details) params.set("details", input.details);
  if (input.location) params.set("location", input.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function eventTitle(meetingType: MeetingType): string {
  return `${meetingType.name} · ${site.name}`;
}

function eventDescription(details: BookingDetails): string {
  if (details.booking.status === "cancelled") return `This session has been cancelled. Details: ${manageUrl(details.booking)}`;
  const link = joinLinkFor(details);
  return [
    link ? `Join the call: ${link}` : `${details.meetingType.locationLabel}: we'll email your meeting link before the call.`,
    `Need to reschedule or cancel? ${manageUrl(details.booking)}`,
  ].join("\n\n");
}

export function bookingGoogleCalendarUrl(details: BookingDetails): string {
  return googleCalendarUrl({
    title: eventTitle(details.meetingType),
    start: details.booking.startAt,
    end: details.booking.endAt,
    details: eventDescription(details),
    location: joinLinkFor(details) ?? details.meetingType.locationLabel,
  });
}

/** RFC 5545 invite for a booking. Increment `sequence` on every update of the same booking. */
export function bookingIcs(details: BookingDetails, method: IcsMethod, sequence = 0): string {
  const { booking, meetingType, contact } = details;
  return buildIcs({
    method,
    event: {
      uid: `${booking.id}@${ICS_UID_DOMAIN}`,
      start: booking.startAt,
      end: booking.endAt,
      summary: eventTitle(meetingType),
      description: eventDescription(details),
      location: joinLinkFor(details) ?? meetingType.locationLabel,
      url: manageUrl(booking),
      organizer: { name: site.name, email: site.contactEmail },
      // iTIP PUBLISH (plain "add to calendar" downloads) must not list attendees.
      attendees: method === "PUBLISH" ? [] : [{ name: contact.name, email: contact.email }],
      status: method === "CANCEL" || booking.status === "cancelled" ? "CANCELLED" : booking.status === "pending_payment" ? "TENTATIVE" : "CONFIRMED",
      sequence,
      alarmMinutesBefore: 15,
    },
  });
}

/**
 * Escapes user-provided text for the Markdown emails (so names, phone numbers or answers can't become
 * formatting or links), keeping its line breaks.
 */
function md(text: string): string {
  return escapeMarkdown(text).replace(/\r?\n/g, "  \n");
}

/** Intake answers as Markdown bullets, labelled with the meeting type's questions. */
export function answersMarkdown(meetingType: MeetingType, answers: Record<string, string>, notes?: string | null): string {
  const lines: string[] = [];
  const labels = new Map(meetingType.questions.map((q) => [q.id, q.label]));
  for (const [id, value] of Object.entries(answers)) {
    if (!value?.trim()) continue;
    lines.push(`- **${md(labels.get(id) ?? id)}**  \n  ${md(value.trim())}`);
  }
  if (notes?.trim()) lines.push(`- **Notes**  \n  ${md(notes.trim())}`);
  return lines.join("\n");
}

/** Plain-text version of the intake answers (for task descriptions). */
export function answersPlainText(meetingType: MeetingType, answers: Record<string, string>, notes?: string | null): string {
  const labels = new Map(meetingType.questions.map((q) => [q.id, q.label]));
  const lines = Object.entries(answers)
    .filter(([, v]) => v?.trim())
    .map(([id, v]) => `${labels.get(id) ?? id}\n${v.trim()}`);
  if (notes?.trim()) lines.push(`Notes\n${notes.trim()}`);
  return lines.join("\n\n");
}

const PREP_TIPS = [
  "Write down the one or two tasks that eat the most of your week. Those are usually the best places to start with AI.",
  "If you already use AI tools (ChatGPT, Claude, Copilot or anything else), have an example ready of what worked and what didn't.",
  "Join from a laptop or desktop if you can, so we can share screens and try ideas live.",
];

export function prepTips(meetingType: Pick<MeetingType, "slug" | "priceCents">): string[] {
  if (meetingType.slug === "implementation-discovery") {
    return [
      "List the processes you'd most like to automate, roughly how often they happen and who does them today.",
      "Note the tools your team already relies on (CRM, email, spreadsheets, help desk…) so we can plan around them.",
      "Have a rough budget and timeline in mind. It helps us recommend the right scope.",
    ];
  }
  if (meetingType.priceCents > 0) {
    return [
      "Bring real work: a document, a process or a problem you'd like to solve together during the session.",
      "Have the AI tools you use (or want to use) open and logged in so we can build in them live.",
      "Join from a laptop or desktop so we can share screens.",
    ];
  }
  return PREP_TIPS;
}

export type BookingEmailExtra = {
  reason?: string | null;
  previousStart?: Date | null;
  previousEnd?: Date | null;
  /** Reschedules: the timezone the old time was booked in (the invitee may have picked a new one). */
  previousTimezone?: string | null;
  /** Cancellations: what the invitee paid for the session (none for free or unpaid bookings). */
  paid?: { amountCents: number; currency: string } | null;
  /** Cancellations: who cancelled. When the business cancels a paid session, the invitee is owed a full refund. */
  by?: "invitee" | "admin";
};

/**
 * Subject + Markdown body for every booking email. Times are shown in the invitee's timezone. `businessName`
 * (Admin → Settings, see `emailBusinessName()`) signs the email.
 */
export function bookingEmailMarkdown(
  kind: BookingEmailKind,
  details: BookingDetails,
  extra: BookingEmailExtra & { businessName?: string } = {},
): { subject: string; markdown: string; preheader: string } {
  const { booking, meetingType, contact } = details;
  const when = describeTime(booking.startAt, booking.endAt, booking.timezone);
  const whenLine = `${when.dateLabel} · ${when.timeLabel} (${when.zoneLong})`;
  const link = joinLinkFor(details);
  const hi = `Hi ${md(firstName(contact.name, contact.email))},`;
  const where = link
    ? `[Join the video call](${link}) · ${md(meetingType.locationLabel)}`
    : `${md(meetingType.locationLabel)}. We'll email your meeting link before the call.`;
  const detailsBlock = [
    `**${md(meetingType.name)}**`,
    "",
    `- **When:** ${whenLine}`,
    `- **Length:** ${formatDuration(meetingType.durationMin)}`,
    `- **Where:** ${where}`,
  ].join("\n");
  const calendar = `[Add to Google Calendar](${bookingGoogleCalendarUrl(details)}) · [Download calendar file (.ics)](${icsDownloadUrl(booking)})`;
  const manage = `Need to change something? [Reschedule or cancel here](${manageUrl(booking)}).`;
  const signoff = `Talk soon,  \nThe ${md(extra.businessName || site.name)} team`;
  const tips = prepTips(meetingType)
    .map((t) => `- ${t}`)
    .join("\n");

  switch (kind) {
    case "confirmation":
      return {
        subject: `Confirmed: ${meetingType.name} on ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr}`,
        preheader: `You're booked for ${when.dateLabel} at ${when.startTimeLabel}.`,
        markdown: [
          hi,
          "",
          "You're booked! Here are the details:",
          "",
          detailsBlock,
          "",
          calendar,
          "",
          "A calendar invite is attached to this email as well.",
          "",
          "### How to get the most from our time",
          "",
          tips,
          "",
          manage,
          "",
          signoff,
        ].join("\n"),
      };
    case "reminder":
      return {
        subject: `Reminder: ${meetingType.name} on ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr}`,
        preheader: `See you ${when.dateLabel} at ${when.startTimeLabel}.`,
        markdown: [hi, "", "A quick reminder about your upcoming session:", "", detailsBlock, "", "### Before we meet", "", tips, "", manage, "", signoff].join(
          "\n",
        ),
      };
    case "rescheduled": {
      const prev =
        extra.previousStart && extra.previousEnd
          ? describeTime(extra.previousStart, extra.previousEnd, extra.previousTimezone || booking.timezone)
          : null;
      return {
        subject: `Updated: ${meetingType.name} moved to ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr}`,
        preheader: `Your new time is ${when.dateLabel} at ${when.startTimeLabel}.`,
        markdown: [
          hi,
          "",
          prev
            ? `Your session has been moved from ~~${prev.dateLabel} at ${prev.startTimeLabel} ${prev.zoneAbbr}~~ to a new time:`
            : "Your session has been moved to a new time:",
          "",
          detailsBlock,
          "",
          calendar,
          "",
          "The attached calendar invite replaces the old one.",
          "",
          manage,
          "",
          signoff,
        ].join("\n"),
      };
    }
    case "cancelled": {
      const paid = extra.paid && extra.paid.amountCents > 0 ? formatMoney(extra.paid.amountCents, extra.paid.currency) : null;
      const rebook = `Whenever you're ready, you can [book a new time](${absoluteUrl(meetingType.active ? `/book/${meetingType.slug}` : "/book")}). In the meantime, the [free AI Readiness Assessment](${absoluteUrl("/assessment")}) is a great way to find your best next step.`;
      // Booking again online takes a new payment, so a paid session we cancelled is refunded or moved by reply instead.
      const next = !paid
        ? [rebook]
        : extra.by === "admin"
          ? [
              `Because we cancelled, you're entitled to a full refund of ${paid}. Just reply to this email and we'll process your refund, or find you a new time at no extra cost if you'd rather reschedule.`,
            ]
          : [`If you'd like a refund of ${paid}, just reply to this email and let us know.`, "", rebook];
      return {
        subject: `Cancelled: ${meetingType.name} on ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr}`,
        preheader: "Your session has been cancelled.",
        markdown: [
          hi,
          "",
          `Your **${md(meetingType.name)}** on ${whenLine} has been cancelled.`,
          ...(extra.reason?.trim() ? ["", `> ${md(extra.reason.trim())}`] : []),
          "",
          ...next,
          "",
          signoff,
        ].join("\n"),
      };
    }
  }
}

/** ICS SEQUENCE for a booking = number of times it has been rescheduled. */
export async function rescheduleCount(bookingId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ n: count() })
    .from(schema.activities)
    .where(and(eq(schema.activities.type, "booking_rescheduled"), sql`${schema.activities.meta}->>'bookingId' = ${bookingId}`));
  return Number(row?.n ?? 0);
}

/** Sends a booking email to the invitee (with an ICS attachment, except reminders). Never throws. */
export async function sendBookingEmail(
  kind: BookingEmailKind,
  details: BookingDetails,
  extra: BookingEmailExtra & { sequence?: number } = {},
): Promise<void> {
  try {
    const { subject, markdown, preheader } = bookingEmailMarkdown(kind, details, { ...extra, businessName: await emailBusinessName() });
    const method: IcsMethod = kind === "cancelled" ? "CANCEL" : "REQUEST";
    const attachments =
      kind === "reminder"
        ? undefined
        : [
            {
              filename: kind === "cancelled" ? "cancelled.ics" : "invite.ics",
              content: Buffer.from(bookingIcs(details, method, extra.sequence ?? 0), "utf8").toString("base64"),
              contentType: `text/calendar; charset=utf-8; method=${method}`,
            },
          ];
    await sendEmail({
      to: details.contact.email,
      subject,
      markdown,
      preheader,
      kind: `booking_${kind}`,
      contactId: details.contact.id,
      attachments,
    });
  } catch (err) {
    console.error(`[booking] failed to send ${kind} email`, details.booking.id, err);
  }
}

/* ------------------------------------------------------------------ */
/* Confirmation side effects                                           */
/* ------------------------------------------------------------------ */

/** Invitee-typed text for a calendar event description, which Google Calendar may render as HTML. */
const calendarText = (text: string) => text.replace(/[<>]/g, "");

/**
 * "Add to Google Calendar" link for the owner's own calendar: named after the invitee, with their contact
 * details and the meeting link (the invitee's link and invite are worded for the invitee).
 */
export function ownerGoogleCalendarUrl(details: BookingDetails): string {
  const { booking, meetingType, contact } = details;
  const link = meetingLinkFor(details);
  const who = calendarText(contact.name?.trim() || contact.email);
  return googleCalendarUrl({
    title: `${meetingType.name} with ${who}`,
    start: booking.startAt,
    end: booking.endAt,
    details: [
      `Invitee: ${contact.name?.trim() ? `${who} (${calendarText(contact.email)})` : who}${contact.phone ? ` · ${calendarText(contact.phone)}` : ""}`,
      link ? `Join the call: ${link}` : `No meeting link is set: email one to ${calendarText(contact.email)} before the call.`,
      `Bookings: ${absoluteUrl("/admin/bookings")}`,
    ].join("\n\n"),
    location: link ?? meetingType.locationLabel,
  });
}

function ownerSummary(details: BookingDetails, businessTz: string, headline: string): string {
  const { booking, meetingType, contact } = details;
  const answers = answersMarkdown(meetingType, booking.answers, booking.notes);
  // A confirmed call (new or moved) goes straight onto the owner's calendar from the alert.
  const calendar = booking.status === "confirmed" ? ` · [Add to Google Calendar](${ownerGoogleCalendarUrl(details)})` : "";
  return [
    headline,
    "",
    `- **When:** ${formatMeetingTime(booking.startAt, booking.endAt, businessTz)}`,
    `- **Invitee:** ${md(contact.name ?? "")} · ${md(contact.email)}${contact.phone ? ` · ${md(contact.phone)}` : ""}`,
    `- **Invitee timezone:** ${booking.timezone}`,
    ...(meetingType.priceCents > 0 ? [`- **Price:** ${formatMoney(meetingType.priceCents)}`] : []),
    ...(answers ? ["", "**Their answers**", "", answers] : []),
    "",
    `[View bookings](${absoluteUrl("/admin/bookings")})${calendar}`,
  ].join("\n");
}

export type BookingPayment = Pick<Order, "id" | "amountCents" | "currency" | "isTest" | "stripePaymentIntentId">;

/** The payment taken for a booking (the first one, if it was paid more than once), or null when nothing is paid (or it was refunded). */
export async function paidOrderForBooking(bookingId: string): Promise<BookingPayment | null> {
  if (!isUuid(bookingId)) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      id: schema.orders.id,
      amountCents: schema.orders.amountCents,
      currency: schema.orders.currency,
      isTest: schema.orders.isTest,
      stripePaymentIntentId: schema.orders.stripePaymentIntentId,
    })
    .from(schema.orders)
    .where(and(eq(schema.orders.bookingId, bookingId), eq(schema.orders.status, "paid")))
    .orderBy(asc(schema.orders.paidAt), asc(schema.orders.createdAt))
    .limit(1);
  return row && row.amountCents > 0 ? row : null;
}

/** Reminder for the owner when invitees are told "we'll email your meeting link" (no link is set). */
export function missingMeetingLinkNote(details: BookingDetails): string | null {
  if (meetingLinkFor(details)) return null;
  return `Action needed: no meeting link is set for ${details.meetingType.name}, so ${details.contact.email} was told you'll email one before the call. Send it, or add a Meeting link to this meeting type in Admin → Availability so it's included automatically.`;
}

/** Description of the "Prepare for…" task: missing-link action (if any), meeting time and intake answers. */
export function prepTaskDescription(details: BookingDetails, businessTz: string): string {
  const { booking, meetingType } = details;
  return [missingMeetingLinkNote(details), formatMeetingTime(booking.startAt, booking.endAt, businessTz), answersPlainText(meetingType, booking.answers, booking.notes)]
    .filter(Boolean)
    .join("\n\n");
}

/** The open "Prepare for…" task created with a booking: due an hour before the call it was made for. */
function prepTaskWhere(contactId: string, start: Date) {
  return and(
    eq(schema.tasks.contactId, contactId),
    eq(schema.tasks.origin, "booking"),
    eq(schema.tasks.dueAt, new Date(start.getTime() - HOUR_MS)),
    isNull(schema.tasks.completedAt),
  );
}

/** Moves the booking's "Prepare for…" task to its new time (`details` holds the moved booking) and rewrites its description to match. */
async function movePrepTask(details: BookingDetails, oldStart: Date, businessTz: string): Promise<void> {
  const db = await getDb();
  await db
    .update(schema.tasks)
    .set({ dueAt: new Date(details.booking.startAt.getTime() - HOUR_MS), description: prepTaskDescription(details, businessTz) })
    .where(prepTaskWhere(details.contact.id, oldStart));
}

/** Removes the "Prepare for…" task of a cancelled booking. */
async function removePrepTask(contactId: string, start: Date): Promise<void> {
  const db = await getDb();
  await db.delete(schema.tasks).where(prepTaskWhere(contactId, start));
}

/**
 * Rewrites the "Prepare for…" tasks of a meeting type's upcoming confirmed bookings, e.g. once the owner has added a
 * meeting link, so they no longer say one is missing. Returns how many bookings were checked.
 */
export async function refreshPrepTasks(meetingTypeId: string): Promise<number> {
  if (!isUuid(meetingTypeId)) return 0;
  const db = await getDb();
  const businessTz = await getBusinessTimezone().catch(() => site.timezone);
  const upcoming = await db
    .select({ booking: schema.bookings, meetingType: schema.meetingTypes, contact: schema.contacts })
    .from(schema.bookings)
    .innerJoin(schema.meetingTypes, eq(schema.meetingTypes.id, schema.bookings.meetingTypeId))
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.bookings.contactId))
    .where(and(eq(schema.bookings.meetingTypeId, meetingTypeId), eq(schema.bookings.status, "confirmed"), gt(schema.bookings.startAt, new Date())))
    .limit(500);
  for (const details of upcoming) {
    await db
      .update(schema.tasks)
      .set({ description: prepTaskDescription(details, businessTz) })
      .where(prepTaskWhere(details.contact.id, details.booking.startAt));
  }
  return upcoming.length;
}

/**
 * Everything that happens once a booking is confirmed (free immediately, paid after checkout):
 * CRM lead capture (stage → call_booked, automations, owner notification), prep task, and the
 * confirmation email with an ICS invite. Each step is isolated so one failure doesn't block the rest.
 */
export async function finalizeConfirmedBooking(details: BookingDetails, opts: { paid: boolean }): Promise<void> {
  const { booking, meetingType, contact } = details;
  const businessTz = await getBusinessTimezone().catch(() => site.timezone);
  const owner = describeTime(booking.startAt, booking.endAt, businessTz);
  const label = `${owner.shortDateLabel} at ${owner.startTimeLabel} ${owner.zoneAbbr}`;
  const name = contact.name ?? contact.email;
  const linkNote = missingMeetingLinkNote(details);

  try {
    await captureLead({
      email: contact.email,
      name: contact.name,
      phone: contact.phone,
      source: "booking",
      activity: {
        type: "booking_created",
        title: opts.paid ? `Paid for and booked ${meetingType.name} for ${label}` : `Booked ${meetingType.name} for ${label}`,
        body: answersPlainText(meetingType, booking.answers, booking.notes) || null,
        meta: { bookingId: booking.id, answers: booking.answers, meetingType: meetingType.slug, startAt: booking.startAt.toISOString(), paid: opts.paid },
      },
      event: {
        name: "booking_created",
        path: `/book/${meetingType.slug}`,
        props: { meetingType: meetingType.slug, paid: opts.paid, priceCents: meetingType.priceCents },
      },
      stage: "call_booked",
      automation: "call_booked",
      notify: {
        kind: "booking",
        subject: `New booking: ${name} · ${meetingType.name} (${label})`,
        markdown: ownerSummary(
          details,
          businessTz,
          `**${md(name)}** booked **${md(meetingType.name)}**${opts.paid ? " and paid online" : ""}.${linkNote ? `\n\n**${md(linkNote)}**` : ""}`,
        ),
      },
    });
  } catch (err) {
    console.error("[booking] CRM capture failed", booking.id, err);
  }

  try {
    await createTask({
      title: `Prepare for ${meetingType.name} with ${name}`,
      contactId: contact.id,
      dueAt: new Date(booking.startAt.getTime() - HOUR_MS),
      origin: "booking",
      description: prepTaskDescription(details, businessTz),
    });
  } catch (err) {
    console.error("[booking] task creation failed", booking.id, err);
  }

  await sendBookingEmail("confirmation", details);
}

/* ------------------------------------------------------------------ */
/* Paid bookings                                                       */
/* ------------------------------------------------------------------ */

/**
 * Tells the owner (once per extra payment) when one booking has been paid for more than once, e.g. two
 * checkouts for the same hold both completed, so the duplicate can be refunded.
 */
async function alertDuplicatePayments(details: BookingDetails): Promise<void> {
  const { booking, meetingType, contact } = details;
  const db = await getDb();
  const paid = await db
    .select({
      id: schema.orders.id,
      amountCents: schema.orders.amountCents,
      currency: schema.orders.currency,
      isTest: schema.orders.isTest,
      stripePaymentIntentId: schema.orders.stripePaymentIntentId,
    })
    .from(schema.orders)
    .where(and(eq(schema.orders.bookingId, booking.id), eq(schema.orders.status, "paid")))
    .orderBy(asc(schema.orders.paidAt), asc(schema.orders.createdAt));
  const who = contact.name ?? contact.email;
  for (const extra of paid.slice(1)) {
    // rate_limits doubles as an "already sent" marker: payment events are retried for days.
    if (!(await rateLimit(`duplicate-booking-payment:${extra.id}`, 1, 7 * 86_400)).ok) continue;
    const amount = `${formatMoney(extra.amountCents, extra.currency)}${extra.isTest ? ", test payment" : ""}`;
    const refund = extra.stripePaymentIntentId
      ? `[refund it in Stripe](${stripeDashboardUrl(extra.stripePaymentIntentId, extra.isTest)})`
      : "refund it";
    await notifyOwner(
      `Action needed: duplicate payment for ${meetingType.name} (${who})`,
      [
        `**${md(who)}** paid for the same **${md(meetingType.name)}** booking more than once. Please ${refund} and let them know.`,
        "",
        `- **Duplicate order:** ${extra.id} (${amount})`,
        `- **First payment:** order ${paid[0].id}`,
        `- **Email:** ${md(contact.email)}`,
        "",
        `[View orders](${absoluteUrl("/admin/orders")})`,
      ].join("\n"),
    );
    await createTask({
      title: `Refund duplicate payment from ${who} (${formatMoney(extra.amountCents, extra.currency)})`,
      contactId: contact.id,
      priority: "high",
      origin: "payment",
      description: `${who} paid twice for ${meetingType.name}. Refund order ${extra.id} and keep order ${paid[0].id}.`,
    });
  }
}

/** Called by payments.fulfillOrder when a paid meeting's checkout completes. Confirms + emails. Idempotent. */
export async function confirmPaidBooking(bookingId: string): Promise<void> {
  if (!isUuid(bookingId)) throw new Error(`Invalid booking id: ${bookingId}`);
  const existing = await getBookingDetails({ id: bookingId });
  if (!existing) throw new Error(`Booking ${bookingId} not found`);
  const { booking, meetingType, contact } = existing;
  await alertDuplicatePayments(existing).catch((err) => console.error("[booking] duplicate payment check failed", bookingId, err));
  // Already confirmed (duplicate webhook) or finished → nothing to do.
  if (booking.status !== "pending_payment" && booking.status !== "cancelled") return;
  // A booking the invitee or admin cancelled on purpose is never revived by a late payment.
  const revivable =
    booking.status === "pending_payment" ||
    ((booking.cancelReason === HOLD_EXPIRED_REASON || booking.cancelReason === CHECKOUT_FAILED_REASON) && booking.startAt.getTime() > Date.now());

  const reminderHours = await reminderWindowHours();
  // Claim under the booking lock. If the hold lapsed before payment arrived, someone else may have
  // taken the time in the meantime, so re-check for overlaps before confirming.
  const outcome = await withBookingLock(async (tx): Promise<"confirmed" | "noop" | "unavailable"> => {
    if (revivable && !(await hasConflict(tx, booking.startAt, booking.endAt, meetingType.bufferMin, booking.id))) {
      const [row] = await tx
        .update(schema.bookings)
        .set({
          status: "confirmed",
          holdExpiresAt: null,
          cancelledAt: null,
          cancelReason: null,
          reminderSentAt: reminderSentAtFor(booking.startAt, reminderHours),
        })
        .where(and(eq(schema.bookings.id, booking.id), eq(schema.bookings.status, booking.status)))
        .returning({ id: schema.bookings.id });
      // No row → a concurrent call already handled it.
      return row ? "confirmed" : "noop";
    }
    // The time is gone: mark the booking once so repeated calls don't notify the owner again.
    const previous = booking.cancelReason && booking.cancelReason !== HOLD_EXPIRED_REASON ? ` (${booking.cancelReason})` : "";
    const [marked] = await tx
      .update(schema.bookings)
      .set({
        status: "cancelled",
        cancelledAt: booking.cancelledAt ?? new Date(),
        cancelReason: `${PAID_UNAVAILABLE_REASON}${previous}`.slice(0, 1000),
        holdExpiresAt: null,
      })
      .where(
        and(
          eq(schema.bookings.id, booking.id),
          inArray(schema.bookings.status, ["pending_payment", "cancelled"] satisfies BookingStatus[]),
          or(isNull(schema.bookings.cancelReason), notLike(schema.bookings.cancelReason, `${PAID_UNAVAILABLE_REASON}%`)),
        ),
      )
      .returning({ id: schema.bookings.id });
    return marked ? "unavailable" : "noop";
  });

  if (outcome === "noop") return;
  // Paid for now: any other checkout still open for this booking (e.g. from a retry in another tab) must not take a second payment.
  await retireOpenCheckouts(booking.id);
  if (outcome === "unavailable") {
    const businessTz = await getBusinessTimezone();
    await logActivity(contact.id, "note", `Payment received for ${meetingType.name}, but the time is no longer available`, {
      body: "The reserved time was released before payment completed. Reach out to arrange a new time or a refund.",
      meta: { bookingId: booking.id },
    }).catch((err) => console.error("[booking] activity log failed", err));
    await notifyOwner(
      `Action needed: paid booking without a slot (${contact.name ?? contact.email})`,
      ownerSummary(
        existing,
        businessTz,
        `**${md(contact.name ?? contact.email)}** paid for **${md(meetingType.name)}**, but the booking had been released or cancelled before payment completed and the time is no longer available. Please contact them to arrange a new time or issue a refund.`,
      ),
      { replyTo: contact.email },
    ).catch((err) => console.error("[booking] owner notification failed", err));
    return;
  }

  const details = await getBookingDetails({ id: bookingId });
  if (!details) throw new Error(`Booking ${bookingId} not found`);
  await finalizeConfirmedBooking(details, { paid: true });
}

/* ------------------------------------------------------------------ */
/* Cancel / reschedule / outcomes                                      */
/* ------------------------------------------------------------------ */

export type BookingChangeResult = { ok: true } | { ok: false; error: string; slotTaken?: boolean };

/** Cancels an upcoming booking, emails the invitee a CANCEL invite and (for invitee cancellations) notifies the owner. */
export async function cancelBooking(
  bookingId: string,
  opts: { reason?: string | null; by: "invitee" | "admin"; notifyInvitee?: boolean },
): Promise<BookingChangeResult> {
  const details = await getBookingDetails({ id: bookingId });
  if (!details) return { ok: false, error: "We couldn't find that booking." };
  const { booking, meetingType, contact } = details;
  if (!isChangeable(booking)) {
    return { ok: false, error: booking.status === "cancelled" ? "This booking is already cancelled." : "This meeting has already taken place, so it can't be cancelled." };
  }
  const reason = opts.reason?.trim().slice(0, 1000) || null;
  const db = await getDb();
  const [row] = await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: new Date(), cancelReason: reason, holdExpiresAt: null })
    .where(and(eq(schema.bookings.id, booking.id), inArray(schema.bookings.status, ["confirmed", "pending_payment"] satisfies BookingStatus[])))
    .returning();
  if (!row) return { ok: false, error: "This booking was just updated. Please refresh the page." };

  const businessTz = await getBusinessTimezone();
  const owner = describeTime(booking.startAt, booking.endAt, businessTz);
  const wasConfirmed = booking.status === "confirmed";
  const fresh: BookingDetails = { ...details, booking: row };
  // A confirmed paid session: the invitee and the owner are told how a refund works.
  const payment = wasConfirmed ? await paidOrderForBooking(booking.id).catch(() => null) : null;

  await Promise.allSettled([
    logActivity(contact.id, "booking_cancelled", `Cancelled ${meetingType.name} (${owner.shortDateLabel} at ${owner.startTimeLabel} ${owner.zoneAbbr})`, {
      body: reason,
      meta: { bookingId: booking.id, by: opts.by, reason },
    }),
    db
      .update(schema.orders)
      .set({ status: "expired" })
      .where(and(eq(schema.orders.bookingId, booking.id), eq(schema.orders.status, "pending"))),
    removePrepTask(contact.id, booking.startAt),
    wasConfirmed ? stopCallPrepUnlessBooked(contact.id, booking.id) : Promise.resolve(),
  ]);

  if (wasConfirmed && opts.notifyInvitee !== false) {
    const sequence = (await rescheduleCount(booking.id).catch(() => 0)) + 1;
    await sendBookingEmail("cancelled", fresh, {
      reason: opts.by === "admin" ? reason : null,
      sequence,
      by: opts.by,
      paid: payment ? { amountCents: payment.amountCents, currency: payment.currency } : null,
    });
  }

  if (opts.by === "invitee" && wasConfirmed) {
    try {
      const settings = await getSettings();
      if (settings.notifyOnBooking) {
        await notifyOwner(
          `Booking cancelled: ${contact.name ?? contact.email} · ${meetingType.name}`,
          ownerSummary(
            fresh,
            businessTz,
            [
              `**${md(contact.name ?? contact.email)}** cancelled **${md(meetingType.name)}**.`,
              reason ? `\n> ${md(reason)}` : "",
              payment
                ? `\nThis was a paid session (${formatMoney(payment.amountCents, payment.currency)}${payment.isTest ? ", test payment" : ""}). They've been told to reply to their cancellation email if they'd like a refund. ${
                    payment.stripePaymentIntentId
                      ? `[Open the payment in Stripe](${stripeDashboardUrl(payment.stripePaymentIntentId, payment.isTest)})`
                      : `[Find the order in Orders](${absoluteUrl("/admin/orders")})`
                  } to refund it.`
                : meetingType.priceCents > 0
                  ? `\nThis was a paid session (${formatMoney(meetingType.priceCents)}). Issue a refund if appropriate: [view orders](${absoluteUrl("/admin/orders")}).`
                  : "",
            ].join(""),
          ),
          { replyTo: contact.email },
        );
      }
    } catch (err) {
      console.error("[booking] owner notification failed", err);
    }
  }
  return { ok: true };
}

/**
 * Stops the "call booked" email sequence (call prep) after a cancellation, unless the contact still
 * has another upcoming confirmed booking. A new booking restarts it (call_booked is re-triggerable).
 */
async function stopCallPrepUnlessBooked(contactId: string, cancelledBookingId: string): Promise<void> {
  const db = await getDb();
  const [other] = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.contactId, contactId),
        eq(schema.bookings.status, "confirmed"),
        gt(schema.bookings.startAt, new Date()),
        ne(schema.bookings.id, cancelledBookingId),
      ),
    )
    .limit(1);
  if (!other) await stopAutomations(contactId, "call_booked");
}

/** Moves a confirmed upcoming booking to a new start time (same duration), re-checking availability under the lock. */
export async function rescheduleBooking(
  bookingId: string,
  newStart: Date,
  opts: { timezone?: string | null; by: "invitee" | "admin" },
): Promise<BookingChangeResult> {
  const details = await getBookingDetails({ id: bookingId });
  if (!details) return { ok: false, error: "We couldn't find that booking." };
  const { booking, meetingType, contact } = details;
  if (booking.status !== "confirmed" || booking.startAt.getTime() <= Date.now()) {
    return { ok: false, error: "Only upcoming, confirmed bookings can be rescheduled." };
  }
  if (Number.isNaN(newStart.getTime())) return { ok: false, error: "Please choose a valid time." };
  if (newStart.getTime() === booking.startAt.getTime()) return { ok: false, error: "That's already your current time. Pick a different one." };
  if (!(await isSlotAvailable(meetingType, newStart, { excludeBookingId: booking.id }))) {
    return { ok: false, error: "Sorry, that time is no longer available. Please pick another.", slotTaken: true };
  }
  const newEnd = new Date(newStart.getTime() + meetingType.durationMin * MINUTE_MS);
  const reminderHours = await reminderWindowHours();
  const updated = await withBookingLock(async (tx) => {
    if (await hasConflict(tx, newStart, newEnd, meetingType.bufferMin, booking.id)) return null;
    const [row] = await tx
      .update(schema.bookings)
      .set({
        startAt: newStart,
        endAt: newEnd,
        timezone: opts.timezone || booking.timezone,
        // The "rescheduled" email covers a new time that's already inside the reminder window.
        reminderSentAt: reminderSentAtFor(newStart, reminderHours),
      })
      .where(and(eq(schema.bookings.id, booking.id), eq(schema.bookings.status, "confirmed"), gt(schema.bookings.startAt, new Date())))
      .returning();
    return row ?? null;
  });
  if (!updated) return { ok: false, error: "Sorry, that time was just taken. Please pick another.", slotTaken: true };

  const businessTz = await getBusinessTimezone();
  const from = describeTime(booking.startAt, booking.endAt, businessTz);
  const to = describeTime(newStart, newEnd, businessTz);
  const fresh: BookingDetails = { ...details, booking: updated };

  await Promise.allSettled([
    logActivity(
      contact.id,
      "booking_rescheduled",
      `Rescheduled ${meetingType.name} to ${to.shortDateLabel} at ${to.startTimeLabel} ${to.zoneAbbr}`,
      { meta: { bookingId: booking.id, from: booking.startAt.toISOString(), to: newStart.toISOString(), by: opts.by } },
    ),
    movePrepTask(fresh, booking.startAt, businessTz),
  ]);
  const sequence = await rescheduleCount(booking.id).catch(() => 1);
  await sendBookingEmail("rescheduled", fresh, {
    previousStart: booking.startAt,
    previousEnd: booking.endAt,
    previousTimezone: booking.timezone,
    sequence,
  });

  if (opts.by === "invitee") {
    try {
      const settings = await getSettings();
      if (settings.notifyOnBooking) {
        await notifyOwner(
          `Booking rescheduled: ${contact.name ?? contact.email} · ${meetingType.name}`,
          ownerSummary(
            fresh,
            businessTz,
            `**${md(contact.name ?? contact.email)}** moved **${md(meetingType.name)}** from ${from.shortDateLabel} at ${from.startTimeLabel} to **${to.shortDateLabel} at ${to.startTimeLabel} ${to.zoneAbbr}**.`,
          ),
          { replyTo: contact.email },
        );
      }
    } catch (err) {
      console.error("[booking] owner notification failed", err);
    }
  }
  return { ok: true };
}

/** Admin: record what happened to a meeting that has started. */
export async function setBookingOutcome(bookingId: string, outcome: "completed" | "no_show"): Promise<BookingChangeResult> {
  const details = await getBookingDetails({ id: bookingId });
  if (!details) return { ok: false, error: "Booking not found." };
  const { booking, meetingType, contact } = details;
  if (!["confirmed", "completed", "no_show"].includes(booking.status)) return { ok: false, error: "Cancelled or unpaid bookings can't be marked." };
  if (booking.startAt.getTime() > Date.now()) return { ok: false, error: "This meeting hasn't started yet." };
  if (booking.status === outcome) return { ok: true };
  const db = await getDb();
  await db.update(schema.bookings).set({ status: outcome }).where(eq(schema.bookings.id, booking.id));
  await logActivity(
    contact.id,
    outcome === "completed" ? "call" : "note",
    outcome === "completed" ? `Completed ${meetingType.name}` : `No-show: ${meetingType.name}`,
    { meta: { bookingId: booking.id, outcome } },
  );
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Cron jobs                                                           */
/* ------------------------------------------------------------------ */

/** How often the cron job runs, in hours: daily on Vercel Hobby. Set CRON_INTERVAL_HOURS=1 with an hourly schedule. */
export function cronIntervalHours(value: string | undefined = process.env.CRON_INTERVAL_HOURS): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 24 * 14) : 24;
}

/**
 * How many hours before a call its reminder may go out: the owner's setting (default 24), widened to
 * the cron interval. A job that runs every N hours has to remind every call starting before its next
 * run, otherwise calls in between would never get a reminder.
 */
export function effectiveReminderHours(settingHours: unknown, cronHours: number = cronIntervalHours()): number {
  const hours = Number(settingHours);
  const windowHours = Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 14) : 24;
  return Math.max(windowHours, cronHours);
}

async function reminderWindowHours(): Promise<number> {
  const settings = await getSettings().catch(() => null);
  return effectiveReminderHours(settings?.bookingReminderHours);
}

/**
 * `reminderSentAt` for a booking confirmed (or moved) right now. A call that already starts inside
 * the reminder window gets no separate reminder: the confirmation email just sent covers it.
 */
export function reminderSentAtFor(startAt: Date, windowHours: number, now: Date = new Date()): Date | null {
  return startAt.getTime() - now.getTime() <= windowHours * HOUR_MS ? now : null;
}

/** Called by the cron job: sends reminder emails for upcoming confirmed bookings. Returns how many were sent. */
export async function sendDueBookingReminders(): Promise<number> {
  const db = await getDb();
  const windowHours = await reminderWindowHours();
  const now = new Date();
  const due = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.status, "confirmed"),
        isNull(schema.bookings.reminderSentAt),
        gt(schema.bookings.startAt, now),
        lte(schema.bookings.startAt, new Date(now.getTime() + windowHours * HOUR_MS)),
      ),
    )
    .limit(500);
  let sent = 0;
  for (const { id } of due) {
    // Claim first so overlapping cron runs never double-send.
    const [claimed] = await db
      .update(schema.bookings)
      .set({ reminderSentAt: new Date() })
      .where(and(eq(schema.bookings.id, id), isNull(schema.bookings.reminderSentAt), eq(schema.bookings.status, "confirmed")))
      .returning({ id: schema.bookings.id });
    if (!claimed) continue;
    const details = await getBookingDetails({ id });
    if (!details) continue;
    await sendBookingEmail("reminder", details);
    sent++;
  }
  return sent;
}

/** Called by the cron job: cancels unpaid pending_payment bookings whose hold expired. Returns how many were released. */
export async function releaseExpiredHolds(): Promise<number> {
  const db = await getDb();
  const now = new Date();
  const released = await db
    .update(schema.bookings)
    .set({ status: "cancelled", cancelledAt: now, cancelReason: HOLD_EXPIRED_REASON })
    .where(and(eq(schema.bookings.status, "pending_payment"), lt(schema.bookings.holdExpiresAt, now)))
    .returning({ id: schema.bookings.id, contactId: schema.bookings.contactId });
  if (!released.length) return 0;
  await db
    .update(schema.orders)
    .set({ status: "expired" })
    .where(and(inArray(schema.orders.bookingId, released.map((r) => r.id)), eq(schema.orders.status, "pending")));
  for (const r of released) {
    await logActivity(r.contactId, "booking_cancelled", "Booking hold released: payment not completed", {
      meta: { bookingId: r.id, reason: HOLD_EXPIRED_REASON },
    }).catch((err) => console.error("[booking] activity log failed", err));
  }
  return released.length;
}
