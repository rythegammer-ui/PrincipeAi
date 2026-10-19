import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, like } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import type { MeetingType } from "@/db/schema";
import {
  bookingEmailMarkdown,
  cancelBooking,
  cronIntervalHours,
  effectiveReminderHours,
  finalizeConfirmedBooking,
  getBookingDetails,
  MAX_PAYMENT_HOLD_MINUTES,
  missingMeetingLinkNote,
  ownerGoogleCalendarUrl,
  paidOrderForBooking,
  PAYMENT_HOLD_MINUTES,
  prepareCheckoutRetry,
  prepTaskDescription,
  refreshPrepTasks,
  reminderSentAtFor,
  rescheduleBooking,
  reserveSlot,
  sendDueBookingReminders,
} from "@/lib/booking-service";
import { formatMeetingTime, getBusinessTimezone, slotsForMeetingType } from "@/lib/scheduling";
import { upsertContact } from "@/lib/crm";
import { createCheckout } from "@/lib/payments";
import { updateSettings } from "@/lib/settings";

const MIN = 60_000;
const HOUR = 60 * MIN;

async function meetingType(overrides: Partial<typeof schema.meetingTypes.$inferInsert> = {}): Promise<MeetingType> {
  const db = await getDb();
  const [mt] = await db
    .insert(schema.meetingTypes)
    .values({ slug: `test-${randomUUID().slice(0, 8)}`, name: "Test Call", durationMin: 30, bufferMin: 0, priceCents: 0, ...overrides })
    .returning();
  return mt;
}

async function contact(name = "Bea Booker") {
  const { contact } = await upsertContact({ email: `booker-${randomUUID().slice(0, 8)}@example.com`, name, source: "booking" });
  return contact;
}

async function reserve(mt: MeetingType, contactId: string, start: Date | string, paid = false) {
  return reserveSlot({ meetingType: mt, contactId, start: new Date(start), timezone: "America/New_York", answers: {}, paid });
}

beforeAll(() => {
  // captureLead logs a harmless warning when there's no request (no visitor cookies).
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  delete process.env.CRON_INTERVAL_HOURS;
});

describe("double-booking protection across meeting types", () => {
  it("keeps the existing meeting's larger buffer when a smaller-buffer type is booked next to it", async () => {
    const coaching = await meetingType({ bufferMin: 60 });
    const quick = await meetingType({ bufferMin: 0 });
    const who = await contact();
    expect(await reserve(coaching, who.id, "2031-03-04T14:00:00Z")).not.toBeNull(); // 14:00–14:30Z

    for (const taken of ["2031-03-04T13:00:00Z", "2031-03-04T13:30:00Z", "2031-03-04T14:30:00Z", "2031-03-04T15:00:00Z"]) {
      expect(await reserve(quick, who.id, taken), taken).toBeNull();
    }
    expect(await reserve(quick, who.id, "2031-03-04T12:30:00Z")).not.toBeNull(); // ends an hour before
    expect(await reserve(quick, who.id, "2031-03-04T15:30:00Z")).not.toBeNull(); // starts an hour after
  });

  it("still applies the new type's own buffer to an existing zero-buffer meeting", async () => {
    const quick = await meetingType({ bufferMin: 0 });
    const coaching = await meetingType({ bufferMin: 60 });
    const who = await contact();
    expect(await reserve(quick, who.id, "2031-03-05T14:00:00Z")).not.toBeNull();
    expect(await reserve(coaching, who.id, "2031-03-05T15:00:00Z")).toBeNull();
    expect(await reserve(coaching, who.id, "2031-03-05T15:30:00Z")).not.toBeNull();
  });
});

describe("booking reminders", () => {
  it("widens the reminder window to the cron interval", () => {
    expect(effectiveReminderHours(2, 24)).toBe(24); // daily cron: remind at the last run before the call
    expect(effectiveReminderHours(48, 24)).toBe(48);
    expect(effectiveReminderHours(2, 1)).toBe(2); // hourly cron honours short windows
    expect(effectiveReminderHours(undefined, 24)).toBe(24);
    expect(effectiveReminderHours("nonsense", 1)).toBe(24);
    expect(effectiveReminderHours(10_000, 1)).toBe(24 * 14);
  });

  it("reads the cron interval from CRON_INTERVAL_HOURS (daily by default)", () => {
    expect(cronIntervalHours(undefined)).toBe(24);
    expect(cronIntervalHours("")).toBe(24);
    expect(cronIntervalHours("0")).toBe(24);
    expect(cronIntervalHours("1")).toBe(1);
    expect(cronIntervalHours("6")).toBe(6);
  });

  it("treats the confirmation email as the reminder for calls already inside the window", () => {
    const now = new Date("2031-01-01T12:00:00Z");
    expect(reminderSentAtFor(new Date(now.getTime() + 23 * HOUR), 24, now)).toEqual(now);
    expect(reminderSentAtFor(new Date(now.getTime() + 25 * HOUR), 24, now)).toBeNull();
  });

  it("reminds every call starting before the next daily run, even with a short window setting", async () => {
    await updateSettings({ bookingReminderHours: 2 });
    try {
      const mt = await meetingType();
      const who = await contact();
      const db = await getDb();
      const now = Date.now();
      const rows = await db
        .insert(schema.bookings)
        .values(
          [20, 30].map((h) => ({
            meetingTypeId: mt.id,
            contactId: who.id,
            startAt: new Date(now + h * HOUR),
            endAt: new Date(now + h * HOUR + 30 * MIN),
            timezone: "UTC",
            status: "confirmed" as const,
          })),
        )
        .returning({ id: schema.bookings.id });
      expect(await sendDueBookingReminders()).toBeGreaterThanOrEqual(1);
      const after = await db
        .select({ id: schema.bookings.id, reminderSentAt: schema.bookings.reminderSentAt })
        .from(schema.bookings)
        .where(inArray(schema.bookings.id, rows.map((r) => r.id)));
      const sent = new Map(after.map((r) => [r.id, r.reminderSentAt]));
      expect(sent.get(rows[0].id)).toBeInstanceOf(Date); // 20h away: inside the next 24h
      expect(sent.get(rows[1].id)).toBeNull(); // 30h away: the next run will remind it
    } finally {
      await updateSettings({ bookingReminderHours: 24 });
    }
  });

  it("doesn't send a separate reminder right after confirming a call that's inside the window", async () => {
    const mt = await meetingType();
    const who = await contact();
    const soon = await reserve(mt, who.id, new Date(Date.now() + 10 * HOUR));
    const later = await reserve(mt, who.id, new Date(Date.now() + 5 * 24 * HOUR));
    expect(soon?.reminderSentAt).toBeInstanceOf(Date);
    expect(later?.reminderSentAt).toBeNull();
  });
});

describe("cancelling a booking", () => {
  async function enrollmentStatus(contactId: string) {
    const db = await getDb();
    const [row] = await db
      .select({ status: schema.sequenceEnrollments.status })
      .from(schema.sequenceEnrollments)
      .innerJoin(schema.emailSequences, eq(schema.emailSequences.id, schema.sequenceEnrollments.sequenceId))
      .where(and(eq(schema.sequenceEnrollments.contactId, contactId), eq(schema.emailSequences.trigger, "call_booked")));
    return row?.status ?? null;
  }

  async function book(mt: MeetingType, contactId: string, start: string) {
    const booking = await reserve(mt, contactId, start);
    if (!booking) throw new Error("slot unexpectedly taken");
    const details = await getBookingDetails({ id: booking.id });
    if (!details) throw new Error("booking not found");
    await finalizeConfirmedBooking(details, { paid: false });
    return booking;
  }

  it("stops the call-prep emails when the contact has no other upcoming call", async () => {
    const mt = await meetingType();
    const who = await contact();
    const booking = await book(mt, who.id, "2031-04-01T15:00:00Z");
    expect(await enrollmentStatus(who.id)).toBe("active");

    expect(await cancelBooking(booking.id, { by: "invitee" })).toEqual({ ok: true });
    expect(await enrollmentStatus(who.id)).toBe("stopped");

    // Booking again restarts them.
    await book(mt, who.id, "2031-04-02T15:00:00Z");
    expect(await enrollmentStatus(who.id)).toBe("active");
  });

  it("keeps the call-prep emails while another call is still booked", async () => {
    const mt = await meetingType();
    const who = await contact();
    const first = await book(mt, who.id, "2031-04-08T15:00:00Z");
    await book(mt, who.id, "2031-04-09T15:00:00Z");
    expect(await cancelBooking(first.id, { by: "admin" })).toEqual({ ok: true });
    expect(await enrollmentStatus(who.id)).toBe("active");
  });
});

describe("meeting link reminder for the owner", () => {
  it("flags bookings whose invitee was promised a link by email", async () => {
    const noLink = await meetingType();
    const withLink = await meetingType({ locationUrl: "https://meet.example.com/abc" });
    const who = await contact();
    const a = await reserve(noLink, who.id, "2031-05-01T15:00:00Z");
    const b = await reserve(withLink, who.id, "2031-05-02T15:00:00Z");
    const da = await getBookingDetails({ id: a!.id });
    const db_ = await getBookingDetails({ id: b!.id });
    expect(missingMeetingLinkNote(da!)).toContain(who.email);
    expect(missingMeetingLinkNote(db_!)).toBeNull();
    expect(missingMeetingLinkNote({ ...da!, booking: { ...da!.booking, meetingUrl: "https://zoom.example.com/j/1" } })).toBeNull();

    await finalizeConfirmedBooking(da!, { paid: false });
    const db = await getDb();
    const [task] = await db.select().from(schema.tasks).where(and(eq(schema.tasks.contactId, who.id), eq(schema.tasks.origin, "booking")));
    expect(task.description).toMatch(/^Action needed: no meeting link/);
  });
});

describe("retrying checkout for a held booking", () => {
  let day = 7;
  async function heldBooking() {
    const mt = await meetingType({ priceCents: 15000 });
    const who = await contact();
    const booking = await reserve(mt, who.id, new Date(Date.now() + day++ * 24 * HOUR), true);
    if (!booking) throw new Error("slot unexpectedly taken");
    return { mt, who, booking };
  }

  async function backdate(bookingId: string, createdMinAgo: number, holdLeftMin: number) {
    const db = await getDb();
    const now = Date.now();
    await db
      .update(schema.bookings)
      .set({ createdAt: new Date(now - createdMinAgo * MIN), holdExpiresAt: new Date(now + holdLeftMin * MIN) })
      .where(eq(schema.bookings.id, bookingId));
  }

  async function hold(bookingId: string) {
    const db = await getDb();
    const [row] = await db.select({ holdExpiresAt: schema.bookings.holdExpiresAt }).from(schema.bookings).where(eq(schema.bookings.id, bookingId));
    return row.holdExpiresAt!.getTime() - Date.now();
  }

  it("refreshes a live hold and retires the abandoned checkout", async () => {
    const { who, booking } = await heldBooking();
    const first = await createCheckout({ itemType: "booking", bookingId: booking.id, email: who.email, name: who.name });
    await backdate(booking.id, 20, 10); // 20 minutes in, 10 left

    expect(await prepareCheckoutRetry(booking.id)).toBe("ok");
    const left = await hold(booking.id);
    expect(left).toBeGreaterThan((PAYMENT_HOLD_MINUTES - 1) * MIN);
    expect(left).toBeLessThanOrEqual(PAYMENT_HOLD_MINUTES * MIN);

    const db = await getDb();
    const [old] = await db.select({ status: schema.orders.status }).from(schema.orders).where(eq(schema.orders.id, first.orderId));
    expect(old.status).toBe("expired"); // the old test checkout can no longer be paid

    const second = await createCheckout({ itemType: "booking", bookingId: booking.id, email: who.email, name: who.name });
    expect(second.url).toBe(`/checkout/test/${second.orderId}`);
  });

  it("never stretches a hold past the maximum from when the booking was made", async () => {
    const { booking } = await heldBooking();
    await backdate(booking.id, MAX_PAYMENT_HOLD_MINUTES - 10, 5);
    expect(await prepareCheckoutRetry(booking.id)).toBe("ok");
    const left = await hold(booking.id);
    expect(left).toBeLessThanOrEqual(10 * MIN);
    expect(left).toBeGreaterThan(9 * MIN);
  });

  it("refuses when the hold has lapsed or the booking isn't awaiting payment", async () => {
    const { booking } = await heldBooking();
    await backdate(booking.id, 40, -1);
    expect(await prepareCheckoutRetry(booking.id)).toBe("lapsed");

    const free = await meetingType();
    const who = await contact();
    const confirmed = await reserve(free, who.id, new Date(Date.now() + 30 * 24 * HOUR));
    expect(await prepareCheckoutRetry(confirmed!.id)).toBe("lapsed");
    expect(await prepareCheckoutRetry("not-a-uuid")).toBe("lapsed");
  });
});

async function latestEmail(where: { to?: string; subjectLike?: string; kind: string }) {
  const db = await getDb();
  const conds = [eq(schema.emailLog.kind, where.kind)];
  if (where.to) conds.push(eq(schema.emailLog.to, where.to));
  if (where.subjectLike) conds.push(like(schema.emailLog.subject, where.subjectLike));
  const [row] = await db.select().from(schema.emailLog).where(and(...conds)).orderBy(desc(schema.emailLog.createdAt)).limit(1);
  return row ?? null;
}

describe("cancelling a paid session", () => {
  let day = 200;
  /** A confirmed paid booking with its paid order (as after checkout). */
  async function paidBooking(name: string, order: Partial<typeof schema.orders.$inferInsert> = {}) {
    const mt = await meetingType({ priceCents: 15000, locationUrl: "https://meet.example.com/coach" });
    const who = await contact(name);
    const held = await reserve(mt, who.id, new Date(Date.now() + day++ * 24 * HOUR), true);
    if (!held) throw new Error("slot unexpectedly taken");
    const db = await getDb();
    await db.update(schema.bookings).set({ status: "confirmed", holdExpiresAt: null }).where(eq(schema.bookings.id, held.id));
    const [paid] = await db
      .insert(schema.orders)
      .values({
        email: who.email,
        name,
        itemType: "booking",
        bookingId: held.id,
        contactId: who.id,
        description: mt.name,
        amountCents: 15000,
        status: "paid",
        paidAt: new Date(),
        ...order,
      })
      .returning();
    return { mt, who, booking: held, order: paid };
  }

  it("finds the payment taken for a booking, ignoring unpaid and refunded orders", async () => {
    const { booking, order } = await paidBooking("Pia Paid");
    expect(await paidOrderForBooking(booking.id)).toMatchObject({ id: order.id, amountCents: 15000, currency: "usd" });

    const db = await getDb();
    await db.update(schema.orders).set({ status: "refunded" }).where(eq(schema.orders.id, order.id));
    expect(await paidOrderForBooking(booking.id)).toBeNull();
    expect(await paidOrderForBooking("not-a-uuid")).toBeNull();
  });

  it("tells the invitee they can ask for a refund, and links the owner to the payment", async () => {
    const name = `Paul Paid ${randomUUID().slice(0, 6)}`;
    const { who, booking } = await paidBooking(name, { stripePaymentIntentId: "pi_test_123", isTest: true });
    expect(await cancelBooking(booking.id, { by: "invitee" })).toEqual({ ok: true });

    const invitee = await latestEmail({ to: who.email, kind: "booking_cancelled" });
    expect(invitee?.html).toContain("refund of $150");
    expect(invitee?.html).toContain("book a new time");

    const owner = await latestEmail({ subjectLike: `%Booking cancelled: ${name}%`, kind: "notification" });
    expect(owner?.html).toContain("https://dashboard.stripe.com/test/payments/pi_test_123");
    expect(owner?.html).not.toContain("Add to Google Calendar");
  });

  it("offers a full refund (not a paid rebooking) when the business cancels", async () => {
    const { who, booking } = await paidBooking("Pat Paid");
    expect(await cancelBooking(booking.id, { by: "admin", reason: "Sorry, I'm unwell." })).toEqual({ ok: true });
    const invitee = await latestEmail({ to: who.email, kind: "booking_cancelled" });
    expect(invitee?.html).toContain("entitled to a full refund of $150");
    expect(invitee?.html).not.toContain("book a new time");
  });

  it("says nothing about money for a free call", async () => {
    const mt = await meetingType();
    const who = await contact();
    const booking = await reserve(mt, who.id, new Date(Date.now() + day++ * 24 * HOUR));
    expect(await cancelBooking(booking!.id, { by: "admin" })).toEqual({ ok: true });
    const invitee = await latestEmail({ to: who.email, kind: "booking_cancelled" });
    expect(invitee?.html).toContain("book a new time");
    expect(invitee?.html).not.toMatch(/refund/i);
  });

  it("words the cancellation email for who cancelled and what was paid", async () => {
    const mt = await meetingType({ priceCents: 15000 });
    const who = await contact();
    const booking = await reserve(mt, who.id, new Date(Date.now() + day++ * 24 * HOUR));
    const details = (await getBookingDetails({ id: booking!.id }))!;
    const paid = { amountCents: 15000, currency: "usd" };
    expect(bookingEmailMarkdown("cancelled", details, { paid, by: "invitee" }).markdown).toContain("If you'd like a refund of $150, just reply to this email");
    expect(bookingEmailMarkdown("cancelled", details, { paid, by: "admin" }).markdown).toContain("Because we cancelled, you're entitled to a full refund of $150");
    expect(bookingEmailMarkdown("cancelled", details, { paid: null, by: "admin" }).markdown).not.toMatch(/refund/i);
  });

  it("shows a rescheduled booking's old time in the timezone it was booked in, with its zone", async () => {
    const mt = await meetingType();
    const who = await contact();
    const booking = await reserve(mt, who.id, "2031-07-08T14:00:00Z");
    const details = (await getBookingDetails({ id: booking!.id }))!;
    // Moved, and the invitee picked another timezone for the new time.
    const moved = {
      ...details,
      booking: { ...details.booking, timezone: "Europe/London", startAt: new Date("2031-07-10T14:00:00Z"), endAt: new Date("2031-07-10T14:30:00Z") },
    };
    const previous = { previousStart: details.booking.startAt, previousEnd: details.booking.endAt };
    expect(bookingEmailMarkdown("rescheduled", moved, { ...previous, previousTimezone: "America/New_York" }).markdown).toContain(
      "moved from ~~Tuesday, July 8, 2031 at 10:00 AM EDT~~ to a new time",
    );
    // Older callers without the old timezone: the booking's own timezone, still labelled.
    expect(bookingEmailMarkdown("rescheduled", moved, previous).markdown).toContain("~~Tuesday, July 8, 2031 at 3:00 PM GMT+1~~");
  });
});

describe("owner calendar link", () => {
  it("adds confirmed bookings to the owner's calendar, named after the invitee", async () => {
    const mt = await meetingType({ name: "Strategy Call", locationUrl: "https://meet.example.com/room" });
    const who = await contact("Dana <b>Customer</b>");
    const booking = await reserve(mt, who.id, "2031-06-03T14:00:00Z");
    const details = (await getBookingDetails({ id: booking!.id }))!;

    const url = new URL(ownerGoogleCalendarUrl(details));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("text")).toBe("Strategy Call with Dana bCustomer/b");
    expect(url.searchParams.get("dates")).toBe("20310603T140000Z/20310603T143000Z");
    expect(url.searchParams.get("location")).toBe("https://meet.example.com/room");
    expect(url.searchParams.get("details")).toContain(who.email);
    expect(url.searchParams.get("details")).not.toMatch(/[<>]/);

    await finalizeConfirmedBooking(details, { paid: false });
    const owner = await latestEmail({ subjectLike: "%New booking: Dana%", kind: "notification" });
    expect(owner?.html).toContain("Add to Google Calendar");
    expect(owner?.html).toContain("calendar.google.com/calendar/render");
  });
});

describe("prep task after a reschedule", () => {
  async function prepTask(contactId: string) {
    const db = await getDb();
    const [task] = await db.select().from(schema.tasks).where(and(eq(schema.tasks.contactId, contactId), eq(schema.tasks.origin, "booking")));
    return task;
  }

  it("moves the task and rewrites its meeting time, and drops the missing-link note once a link is added", async () => {
    const mt = await meetingType({ minNoticeHours: 0, maxDaysAhead: 60 });
    const who = await contact("Rita Rescheduler");
    const now = Date.now();
    const { slots } = await slotsForMeetingType(mt, now + 20 * 24 * HOUR, now + 40 * 24 * HOUR);
    expect(slots.length).toBeGreaterThan(4);
    const booking = await reserve(mt, who.id, slots[0]);
    const details = (await getBookingDetails({ id: booking!.id }))!;
    await finalizeConfirmedBooking(details, { paid: false });
    const before = await prepTask(who.id);
    expect(before.description).toMatch(/^Action needed: no meeting link/);

    const db = await getDb();
    await db.update(schema.meetingTypes).set({ locationUrl: "https://meet.example.com/new" }).where(eq(schema.meetingTypes.id, mt.id));
    const newStart = new Date(slots[4]);
    expect(await rescheduleBooking(booking!.id, newStart, { by: "admin" })).toEqual({ ok: true });

    const after = await prepTask(who.id);
    expect(after.id).toBe(before.id);
    expect(after.dueAt?.getTime()).toBe(newStart.getTime() - HOUR);
    expect(after.description).not.toContain("Action needed");
    const tz = await getBusinessTimezone();
    expect(after.description).toContain(formatMeetingTime(newStart, new Date(newStart.getTime() + 30 * MIN), tz));
    expect(after.description).not.toContain(formatMeetingTime(booking!.startAt, booking!.endAt, tz));
    expect(after.description).toBe(prepTaskDescription((await getBookingDetails({ id: booking!.id }))!, tz));
  });

  it("refreshes upcoming prep tasks when the meeting type gets a link", async () => {
    const mt = await meetingType();
    const who = await contact();
    const booking = await reserve(mt, who.id, new Date(Date.now() + 90 * 24 * HOUR));
    await finalizeConfirmedBooking((await getBookingDetails({ id: booking!.id }))!, { paid: false });
    expect((await prepTask(who.id)).description).toMatch(/^Action needed/);

    const db = await getDb();
    await db.update(schema.meetingTypes).set({ locationUrl: "https://meet.example.com/later" }).where(eq(schema.meetingTypes.id, mt.id));
    expect(await refreshPrepTasks(mt.id)).toBe(1);
    expect((await prepTask(who.id)).description).not.toContain("Action needed");
  });
});
