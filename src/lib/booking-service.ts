import "server-only";
import { and, count, eq, gt, inArray, isNull, lt, lte, ne, notLike, or, sql } from "drizzle-orm";
import { getDb, schema, type DB } from "@/db";
import type { Booking, BookingStatus, Contact, MeetingType } from "@/db/schema";
import { site } from "@/config/site";
import { captureLead, createTask, logActivity } from "@/lib/crm";
import { notifyOwner, sendEmail } from "@/lib/email";
import { buildIcs, formatIcsDate, type IcsMethod } from "@/lib/ics";
import { describeTime, formatDuration, formatMeetingTime, getBusinessTimezone, isSlotAvailable, occupiesSlot } from "@/lib/scheduling";
import { getSettings } from "@/lib/settings";
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
export const HOLD_EXPIRED_REASON = "Payment not completed";
export const CHECKOUT_FAILED_REASON = "Checkout could not be started";
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

async function hasConflict(tx: Tx, start: Date, end: Date, bufferMin: number, excludeBookingId?: string): Promise<boolean> {
  const buffer = Math.max(0, bufferMin) * MINUTE_MS;
  const conds = [
    occupiesSlot(),
    lt(schema.bookings.startAt, new Date(end.getTime() + buffer)),
    gt(schema.bookings.endAt, new Date(start.getTime() - buffer)),
  ];
  if (excludeBookingId) conds.push(ne(schema.bookings.id, excludeBookingId));
  const rows = await tx.select({ id: schema.bookings.id }).from(schema.bookings).where(and(...conds)).limit(1);
  return rows.length > 0;
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
  const link = meetingLinkFor(details);
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
    location: meetingLinkFor(details) ?? details.meetingType.locationLabel,
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
      location: meetingLinkFor(details) ?? meetingType.locationLabel,
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

/** Escapes Markdown control characters in user-provided text (emails are rendered from Markdown). */
function md(text: string): string {
  return text.replace(/([\\`*_[\]<>#|~])/g, "\\$1").replace(/\r?\n/g, "  \n");
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

/** Subject + Markdown body for every booking email. Times are shown in the invitee's timezone. */
export function bookingEmailMarkdown(
  kind: BookingEmailKind,
  details: BookingDetails,
  extra: { reason?: string | null; previousStart?: Date | null; previousEnd?: Date | null } = {},
): { subject: string; markdown: string; preheader: string } {
  const { booking, meetingType, contact } = details;
  const when = describeTime(booking.startAt, booking.endAt, booking.timezone);
  const whenLine = `${when.dateLabel} · ${when.timeLabel} (${when.zoneLong})`;
  const link = meetingLinkFor(details);
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
  const signoff = `Talk soon,  \nThe ${site.name} team`;
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
          ? describeTime(extra.previousStart, extra.previousEnd, booking.timezone)
          : null;
      return {
        subject: `Updated: ${meetingType.name} moved to ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr}`,
        preheader: `Your new time is ${when.dateLabel} at ${when.startTimeLabel}.`,
        markdown: [
          hi,
          "",
          prev ? `Your session has been moved from ~~${prev.dateLabel} at ${prev.startTimeLabel}~~ to a new time:` : "Your session has been moved to a new time:",
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
    case "cancelled":
      return {
        subject: `Cancelled: ${meetingType.name} on ${when.shortDateLabel} at ${when.startTimeLabel} ${when.zoneAbbr}`,
        preheader: "Your session has been cancelled.",
        markdown: [
          hi,
          "",
          `Your **${md(meetingType.name)}** on ${whenLine} has been cancelled.`,
          ...(extra.reason?.trim() ? ["", `> ${md(extra.reason.trim())}`] : []),
          "",
          `Whenever you're ready, you can [book a new time](${absoluteUrl(meetingType.active ? `/book/${meetingType.slug}` : "/book")}). In the meantime, the [free AI Readiness Assessment](${absoluteUrl("/assessment")}) is a great way to find your best next step.`,
          "",
          signoff,
        ].join("\n"),
      };
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
  extra: { reason?: string | null; previousStart?: Date | null; previousEnd?: Date | null; sequence?: number } = {},
): Promise<void> {
  try {
    const { subject, markdown, preheader } = bookingEmailMarkdown(kind, details, extra);
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

function ownerSummary(details: BookingDetails, businessTz: string, headline: string): string {
  const { booking, meetingType, contact } = details;
  const answers = answersMarkdown(meetingType, booking.answers, booking.notes);
  return [
    headline,
    "",
    `- **When:** ${formatMeetingTime(booking.startAt, booking.endAt, businessTz)}`,
    `- **Invitee:** ${md(contact.name ?? "")} · ${contact.email}${contact.phone ? ` · ${md(contact.phone)}` : ""}`,
    `- **Invitee timezone:** ${booking.timezone}`,
    ...(meetingType.priceCents > 0 ? [`- **Price:** ${formatMoney(meetingType.priceCents)}`] : []),
    ...(answers ? ["", "**Their answers**", "", answers] : []),
    "",
    `[View bookings](${absoluteUrl("/admin/bookings")})`,
  ].join("\n");
}

/** Moves (or removes) the "Prepare for…" task that was created with a booking. */
async function updatePrepTask(contactId: string, oldStart: Date, newStart: Date | null): Promise<void> {
  const db = await getDb();
  const where = and(
    eq(schema.tasks.contactId, contactId),
    eq(schema.tasks.origin, "booking"),
    eq(schema.tasks.dueAt, new Date(oldStart.getTime() - HOUR_MS)),
    isNull(schema.tasks.completedAt),
  );
  if (newStart) await db.update(schema.tasks).set({ dueAt: new Date(newStart.getTime() - HOUR_MS) }).where(where);
  else await db.delete(schema.tasks).where(where);
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
        markdown: ownerSummary(details, businessTz, `**${md(name)}** booked **${md(meetingType.name)}**${opts.paid ? " and paid online" : ""}.`),
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
      description: [formatMeetingTime(booking.startAt, booking.endAt, businessTz), answersPlainText(meetingType, booking.answers, booking.notes)]
        .filter(Boolean)
        .join("\n\n"),
    });
  } catch (err) {
    console.error("[booking] task creation failed", booking.id, err);
  }

  await sendBookingEmail("confirmation", details);
}

/* ------------------------------------------------------------------ */
/* Paid bookings                                                       */
/* ------------------------------------------------------------------ */

/** Called by payments.fulfillOrder when a paid meeting's checkout completes. Confirms + emails. Idempotent. */
export async function confirmPaidBooking(bookingId: string): Promise<void> {
  if (!isUuid(bookingId)) throw new Error(`Invalid booking id: ${bookingId}`);
  const existing = await getBookingDetails({ id: bookingId });
  if (!existing) throw new Error(`Booking ${bookingId} not found`);
  const { booking, meetingType, contact } = existing;
  // Already confirmed (duplicate webhook) or finished → nothing to do.
  if (booking.status !== "pending_payment" && booking.status !== "cancelled") return;
  // A booking the invitee or admin cancelled on purpose is never revived by a late payment.
  const revivable =
    booking.status === "pending_payment" ||
    ((booking.cancelReason === HOLD_EXPIRED_REASON || booking.cancelReason === CHECKOUT_FAILED_REASON) && booking.startAt.getTime() > Date.now());

  // Claim under the booking lock. If the hold lapsed before payment arrived, someone else may have
  // taken the time in the meantime, so re-check for overlaps before confirming.
  const outcome = await withBookingLock(async (tx): Promise<"confirmed" | "noop" | "unavailable"> => {
    if (revivable && !(await hasConflict(tx, booking.startAt, booking.endAt, meetingType.bufferMin, booking.id))) {
      const [row] = await tx
        .update(schema.bookings)
        .set({ status: "confirmed", holdExpiresAt: null, cancelledAt: null, cancelReason: null })
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

  await Promise.allSettled([
    logActivity(contact.id, "booking_cancelled", `Cancelled ${meetingType.name} (${owner.shortDateLabel} at ${owner.startTimeLabel} ${owner.zoneAbbr})`, {
      body: reason,
      meta: { bookingId: booking.id, by: opts.by, reason },
    }),
    db
      .update(schema.orders)
      .set({ status: "expired" })
      .where(and(eq(schema.orders.bookingId, booking.id), eq(schema.orders.status, "pending"))),
    updatePrepTask(contact.id, booking.startAt, null),
  ]);

  if (wasConfirmed && opts.notifyInvitee !== false) {
    const sequence = (await rescheduleCount(booking.id).catch(() => 0)) + 1;
    await sendBookingEmail("cancelled", fresh, { reason: opts.by === "admin" ? reason : null, sequence });
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
              wasConfirmed && meetingType.priceCents > 0 ? `\nThis was a paid session (${formatMoney(meetingType.priceCents)}). Issue a refund if appropriate.` : "",
            ].join(""),
          ),
        );
      }
    } catch (err) {
      console.error("[booking] owner notification failed", err);
    }
  }
  return { ok: true };
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
  const updated = await withBookingLock(async (tx) => {
    if (await hasConflict(tx, newStart, newEnd, meetingType.bufferMin, booking.id)) return null;
    const [row] = await tx
      .update(schema.bookings)
      .set({ startAt: newStart, endAt: newEnd, timezone: opts.timezone || booking.timezone, reminderSentAt: null })
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
    updatePrepTask(contact.id, booking.startAt, newStart),
  ]);
  const sequence = await rescheduleCount(booking.id).catch(() => 1);
  await sendBookingEmail("rescheduled", fresh, { previousStart: booking.startAt, previousEnd: booking.endAt, sequence });

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

/** Called by the cron job: sends reminder emails for upcoming confirmed bookings. Returns how many were sent. */
export async function sendDueBookingReminders(): Promise<number> {
  const db = await getDb();
  const settings = await getSettings();
  const hours = Number(settings.bookingReminderHours);
  const windowHours = Number.isFinite(hours) && hours > 0 ? Math.min(hours, 24 * 14) : 24;
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
