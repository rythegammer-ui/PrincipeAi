import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// A controllable stand-in for the Stripe client (null = Stripe not configured → built-in test checkout).
type FakeSession = { id: string; status: "open" | "complete" | "expired"; payment_status: "paid" | "unpaid" | "no_payment_required"; payment_intent: string | null; livemode: boolean; amount_total: number | null };
const mocks = vi.hoisted(() => ({
  stripe: null as null | { checkout: { sessions: { expire: (id: string) => Promise<unknown>; retrieve: (id: string) => Promise<unknown> } } },
}));
vi.mock("@/lib/stripe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/stripe")>()),
  getStripe: () => mocks.stripe,
}));
// next/headers outside a request (the ICS route rate-limits by IP).
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));

import { getDb, schema } from "@/db";
import type { MeetingType } from "@/db/schema";
import { GET as icsRoute } from "@/app/api/bookings/[token]/ics/route";
import {
  bookingGoogleCalendarUrl,
  bookingIcs,
  confirmPaidBooking,
  finalizeConfirmedBooking,
  getBookingDetails,
  HOLD_EXPIRED_REASON,
  joinLinkFor,
  meetingLinkFor,
  prepareCheckoutRetry,
  reserveSlot,
} from "@/lib/booking-service";
import { upsertContact } from "@/lib/crm";
import { unfoldIcs } from "@/lib/ics";
import { createCheckout, fulfillOrder } from "@/lib/payments";

const HOUR = 60 * 60_000;
const ROOM = "https://meet.example.com/private-room-123";
let day = 400;

async function meetingType(overrides: Partial<typeof schema.meetingTypes.$inferInsert> = {}): Promise<MeetingType> {
  const db = await getDb();
  const [mt] = await db
    .insert(schema.meetingTypes)
    .values({ slug: `pay-${randomUUID().slice(0, 8)}`, name: "Paid Coaching", durationMin: 60, bufferMin: 0, priceCents: 15000, locationUrl: ROOM, ...overrides })
    .returning();
  return mt;
}

async function heldBooking(overrides: Partial<typeof schema.meetingTypes.$inferInsert> = {}, name = "Paula Payer") {
  const mt = await meetingType(overrides);
  const { contact } = await upsertContact({ email: `payer-${randomUUID().slice(0, 8)}@example.com`, name, source: "booking" });
  const booking = await reserveSlot({
    meetingType: mt,
    contactId: contact.id,
    start: new Date(Date.now() + day++ * 24 * HOUR),
    timezone: "America/New_York",
    answers: {},
    paid: (overrides.priceCents ?? 15000) > 0,
  });
  if (!booking) throw new Error("slot unexpectedly taken");
  return { mt, contact, booking };
}

async function stripeOrder(bookingId: string, email: string) {
  const db = await getDb();
  const sessionId = `cs_test_${randomUUID().replace(/-/g, "")}`;
  const [order] = await db
    .insert(schema.orders)
    .values({ email, name: "Paula Payer", itemType: "booking", bookingId, description: "Paid Coaching", amountCents: 15000, status: "pending", stripeSessionId: sessionId })
    .returning();
  return order;
}

function session(id: string, patch: Partial<FakeSession>): FakeSession {
  return { id, status: "complete", payment_status: "paid", payment_intent: `pi_${id.slice(8, 20)}`, livemode: false, amount_total: 15000, ...patch };
}

async function orderStatus(orderId: string) {
  const db = await getDb();
  const [row] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  return row;
}

async function bookingStatus(bookingId: string) {
  const db = await getDb();
  const [row] = await db.select({ status: schema.bookings.status }).from(schema.bookings).where(eq(schema.bookings.id, bookingId));
  return row.status;
}

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  mocks.stripe = null;
});

describe("meeting link for unpaid and cancelled bookings", () => {
  it("keeps the paid session's room out of a pending hold's calendar file and links", async () => {
    const { booking } = await heldBooking();
    const details = (await getBookingDetails({ id: booking.id }))!;
    expect(details.booking.status).toBe("pending_payment");
    expect(meetingLinkFor(details)).toBe(ROOM); // still known to the pages (they only show it when confirmed)
    expect(joinLinkFor(details)).toBeNull();
    expect(unfoldIcs(bookingIcs(details, "PUBLISH"))).not.toContain(ROOM);
    expect(decodeURIComponent(bookingGoogleCalendarUrl(details))).not.toContain(ROOM);

    const confirmed = { ...details, booking: { ...details.booking, status: "confirmed" as const } };
    expect(joinLinkFor(confirmed)).toBe(ROOM);
    const ics = unfoldIcs(bookingIcs(confirmed, "PUBLISH"));
    expect(ics).toContain(`LOCATION:${ROOM}`);
    expect(ics).toContain(`Join the call: ${ROOM}`);

    const cancelled = { ...details, booking: { ...details.booking, status: "cancelled" as const } };
    const cancel = unfoldIcs(bookingIcs(cancelled, "CANCEL"));
    expect(cancel).not.toContain(ROOM);
    expect(cancel).toContain("STATUS:CANCELLED");
  });

  it("doesn't serve an unpaid hold's .ics, and serves a released hold's without the link", async () => {
    const { booking } = await heldBooking();
    const get = (token: string) => icsRoute(new Request(`http://localhost/api/bookings/${token}/ics`) as never, { params: Promise.resolve({ token }) });

    expect((await get(booking.manageToken)).status).toBe(404);

    const db = await getDb();
    await db.update(schema.bookings).set({ status: "cancelled", cancelReason: HOLD_EXPIRED_REASON, holdExpiresAt: null }).where(eq(schema.bookings.id, booking.id));
    const released = await get(booking.manageToken);
    expect(released.status).toBe(200);
    const text = unfoldIcs(await released.text());
    expect(text).toContain("METHOD:CANCEL");
    expect(text).not.toContain(ROOM);

    await db.update(schema.bookings).set({ status: "confirmed", cancelReason: null, cancelledAt: null }).where(eq(schema.bookings.id, booking.id));
    const confirmed = unfoldIcs(await (await get(booking.manageToken)).text());
    expect(confirmed).toContain(`LOCATION:${ROOM}`);
  });
});

describe("retrying checkout without charging twice", () => {
  it("closes an abandoned Stripe checkout and allows a new one", async () => {
    const { contact, booking } = await heldBooking();
    const order = await stripeOrder(booking.id, contact.email);
    const expire = vi.fn(async (id: string) => session(id, { status: "expired", payment_status: "unpaid" }));
    mocks.stripe = { checkout: { sessions: { expire, retrieve: vi.fn() } } };

    expect(await prepareCheckoutRetry(booking.id)).toBe("ok");
    expect(expire).toHaveBeenCalledWith(order.stripeSessionId);
    expect((await orderStatus(order.id)).status).toBe("expired");
  });

  it("fulfils an earlier checkout that was paid while its webhook was still on the way", async () => {
    const { contact, booking } = await heldBooking();
    const order = await stripeOrder(booking.id, contact.email);
    const paid = session(order.stripeSessionId!, {});
    mocks.stripe = {
      checkout: {
        sessions: {
          expire: vi.fn(async () => {
            throw new Error("Only Checkout Sessions with a status of open can be expired.");
          }),
          retrieve: vi.fn(async () => paid),
        },
      },
    };

    expect(await prepareCheckoutRetry(booking.id)).toBe("paid");
    const after = await orderStatus(order.id);
    expect(after.status).toBe("paid");
    expect(after.stripePaymentIntentId).toBe(paid.payment_intent);
    expect(await bookingStatus(booking.id)).toBe("confirmed");
  });

  it("doesn't deliver an earlier checkout that was refunded in full before its webhook arrived", async () => {
    const { contact, booking } = await heldBooking();
    const order = await stripeOrder(booking.id, contact.email);
    // Retrieved with payment_intent.latest_charge expanded, as closeCheckout asks for.
    const refunded = {
      ...session(order.stripeSessionId!, {}),
      payment_intent: { id: `pi_${randomUUID().slice(0, 8)}`, object: "payment_intent", status: "succeeded", latest_charge: { id: "ch_r", object: "charge", refunded: true } },
    };
    const retrieve = vi.fn(async () => refunded);
    mocks.stripe = {
      checkout: {
        sessions: {
          expire: vi.fn(async () => {
            throw new Error("Only Checkout Sessions with a status of open can be expired.");
          }),
          retrieve,
        },
      },
    };

    // The refunded checkout is closed, so the invitee can start a new one.
    expect(await prepareCheckoutRetry(booking.id)).toBe("ok");
    expect(retrieve).toHaveBeenCalledWith(order.stripeSessionId, { expand: ["payment_intent", "payment_intent.latest_charge"] });
    expect((await orderStatus(order.id)).status).toBe("refunded");
    expect(await bookingStatus(booking.id)).toBe("pending_payment");
  });

  it("refuses a new checkout while an earlier delayed payment is still clearing", async () => {
    const { contact, booking } = await heldBooking();
    const order = await stripeOrder(booking.id, contact.email);
    mocks.stripe = {
      checkout: {
        sessions: {
          expire: vi.fn(async () => {
            throw new Error("Only Checkout Sessions with a status of open can be expired.");
          }),
          retrieve: vi.fn(async (id: string) => session(id, { payment_status: "unpaid" })),
        },
      },
    };

    expect(await prepareCheckoutRetry(booking.id)).toBe("processing");
    // Left pending so the async_payment webhook (or the reconcile job) still settles it.
    expect((await orderStatus(order.id)).status).toBe("pending");
    expect(await bookingStatus(booking.id)).toBe("pending_payment");
  });

  it("doesn't assume an earlier checkout is closed when Stripe can't be reached", async () => {
    const { contact, booking } = await heldBooking();
    const order = await stripeOrder(booking.id, contact.email);
    const down = vi.fn(async () => {
      throw new Error("connection reset");
    });
    mocks.stripe = { checkout: { sessions: { expire: down, retrieve: down } } };

    await expect(prepareCheckoutRetry(booking.id)).rejects.toThrow("connection reset");
    expect((await orderStatus(order.id)).status).toBe("pending");
  });
});

describe("a booking paid for more than once", () => {
  async function ownerAlerts(orderId: string) {
    const db = await getDb();
    const rows = await db.select().from(schema.emailLog).where(eq(schema.emailLog.kind, "notification"));
    return rows.filter((e) => e.subject.includes("duplicate payment") && e.html.includes(orderId));
  }

  it("alerts the owner once and adds a refund task", async () => {
    const { contact, booking } = await heldBooking();
    const first = await createCheckout({ itemType: "booking", bookingId: booking.id, email: contact.email, name: contact.name });
    const second = await createCheckout({ itemType: "booking", bookingId: booking.id, email: contact.email, name: contact.name });

    await fulfillOrder(first.orderId, { isTest: true });
    expect(await bookingStatus(booking.id)).toBe("confirmed");
    // The other open checkout was closed once the booking was paid for.
    expect((await orderStatus(second.orderId)).status).toBe("expired");
    expect(await ownerAlerts(second.orderId)).toHaveLength(0);

    // ...but suppose it was paid anyway (fulfilment accepts expired orders).
    await fulfillOrder(second.orderId, { isTest: true });
    expect(await ownerAlerts(second.orderId)).toHaveLength(1);
    const db = await getDb();
    const tasks = await db.select().from(schema.tasks).where(and(eq(schema.tasks.contactId, contact.id), eq(schema.tasks.origin, "payment")));
    expect(tasks).toHaveLength(1);
    expect(tasks[0].description).toContain(second.orderId);

    // The second payment's receipt says it will be refunded (not "confirmed"), and the owner's purchase
    // notification is labelled as a duplicate.
    const emails = await db.select().from(schema.emailLog);
    const receiptFor = (orderId: string) => emails.filter((e) => e.kind === "receipt" && e.html.includes(orderId));
    expect(receiptFor(first.orderId)).toHaveLength(1);
    expect(receiptFor(first.orderId)[0].html).toContain("Your session is confirmed");
    expect(receiptFor(second.orderId)).toHaveLength(1);
    expect(receiptFor(second.orderId)[0].html).toContain("This session was already paid for");
    expect(receiptFor(second.orderId)[0].html).not.toContain("Your session is confirmed");
    const purchaseNotes = emails.filter((e) => e.kind === "notification" && e.html.includes(second.orderId) && e.subject.includes("] Duplicate payment:"));
    expect(purchaseNotes).toHaveLength(1);

    // Re-deliveries don't repeat the alert.
    await fulfillOrder(second.orderId, { isTest: true });
    await confirmPaidBooking(booking.id);
    expect(await ownerAlerts(second.orderId)).toHaveLength(1);
  });

  it("expires the booking's other open Stripe checkout once one is paid", async () => {
    const { contact, booking } = await heldBooking();
    const paidHere = await createCheckout({ itemType: "booking", bookingId: booking.id, email: contact.email, name: contact.name });
    const other = await stripeOrder(booking.id, contact.email);
    const expire = vi.fn(async (id: string) => session(id, { status: "expired", payment_status: "unpaid" }));
    mocks.stripe = { checkout: { sessions: { expire, retrieve: vi.fn() } } };

    await fulfillOrder(paidHere.orderId, { isTest: true });
    expect(await bookingStatus(booking.id)).toBe("confirmed");
    expect(expire).toHaveBeenCalledWith(other.stripeSessionId);
    expect((await orderStatus(other.id)).status).toBe("expired");
  });
});

describe("owner emails", () => {
  it("don't turn a visitor's name into a link", async () => {
    const { booking, contact } = await heldBooking({ priceCents: 0 }, "Visit www.example-phish.test now");
    const details = (await getBookingDetails({ id: booking.id }))!;
    await finalizeConfirmedBooking(details, { paid: false });
    const db = await getDb();
    const rows = await db.select().from(schema.emailLog).where(eq(schema.emailLog.kind, "notification"));
    const alert = rows.find((e) => e.subject.startsWith(`[`) && e.subject.includes("New booking") && e.html.includes(contact.email.split("@")[0]));
    expect(alert).toBeDefined();
    expect(alert!.html).toContain("www.example-phish.test");
    expect(alert!.html).not.toMatch(/href="https?:\/\/www\.example-phish\.test/);
  });
});
