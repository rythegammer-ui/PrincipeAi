import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// checkoutMode() is "disabled" on a deployment with no Stripe key and no test checkout (or a demo with a live key).
const mocks = vi.hoisted(() => ({ mode: null as null | "stripe" | "test" | "disabled" }));
vi.mock("@/lib/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments")>();
  return { ...actual, checkoutMode: () => mocks.mode ?? actual.checkoutMode() };
});
// Server actions read the visitor's IP and cookies.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.42" }),
}));

import { createBookingAction } from "@/app/(marketing)/book/[slug]/actions";
import { resumeCheckoutAction } from "@/app/(marketing)/booking/[token]/actions";
import { getDb, schema } from "@/db";
import type { MeetingType } from "@/db/schema";
import { reserveSlot } from "@/lib/booking-service";
import { upsertContact } from "@/lib/crm";
import { slotsForMeetingType } from "@/lib/scheduling";

const HOUR = 60 * 60_000;

async function paidType(): Promise<MeetingType> {
  const db = await getDb();
  const [mt] = await db
    .insert(schema.meetingTypes)
    .values({ slug: `coach-${randomUUID().slice(0, 8)}`, name: "Paid Coaching", durationMin: 60, bufferMin: 0, minNoticeHours: 0, maxDaysAhead: 60, priceCents: 15000 })
    .returning();
  return mt;
}

async function openSlot(mt: MeetingType, offsetDays: number): Promise<string> {
  const from = Date.now() + offsetDays * 24 * HOUR;
  const { slots } = await slotsForMeetingType(mt, from, from + 10 * 24 * HOUR);
  if (!slots[0]) throw new Error("no open slot");
  return slots[0];
}

function bookingForm(mt: MeetingType, start: string, email: string): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ type: mt.slug, start, timezone: "America/New_York", name: "Olive Offline", email, phone: "", notes: "", website: "" })) {
    fd.set(k, v);
  }
  return fd;
}

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  mocks.mode = null;
});

describe("paid sessions while online payment is unavailable", () => {
  it("refuses the booking up front, without holding the slot or creating a contact", async () => {
    mocks.mode = "disabled";
    const mt = await paidType();
    const email = `offline-${randomUUID().slice(0, 8)}@example.com`;
    const result = await createBookingAction({}, bookingForm(mt, await openSlot(mt, 5), email));
    expect(result.error).toMatch(/^Online payment for this session isn't available right now/);
    expect(result.slotTaken).toBeUndefined();

    const db = await getDb();
    expect(await db.select().from(schema.bookings).where(eq(schema.bookings.meetingTypeId, mt.id))).toHaveLength(0);
    expect(await db.select().from(schema.contacts).where(eq(schema.contacts.email, email))).toHaveLength(0);
  });

  it("still sends the visitor to checkout when payment is available", async () => {
    const mt = await paidType();
    const email = `online-${randomUUID().slice(0, 8)}@example.com`;
    await expect(createBookingAction({}, bookingForm(mt, await openSlot(mt, 15), email))).rejects.toMatchObject({
      digest: expect.stringContaining("/checkout/test/"),
    });
    const db = await getDb();
    const [booking] = await db.select().from(schema.bookings).where(eq(schema.bookings.meetingTypeId, mt.id));
    expect(booking.status).toBe("pending_payment");
  });

  it("doesn't suggest retrying checkout for an earlier hold", async () => {
    const mt = await paidType();
    const { contact } = await upsertContact({ email: `held-${randomUUID().slice(0, 8)}@example.com`, name: "Hal Held", source: "booking" });
    const held = await reserveSlot({ meetingType: mt, contactId: contact.id, start: new Date(await openSlot(mt, 25)), timezone: "UTC", answers: {}, paid: true });
    mocks.mode = "disabled";
    const fd = new FormData();
    fd.set("token", held!.manageToken);
    const result = await resumeCheckoutAction({}, fd);
    expect(result.error).toMatch(/^Online payment isn't available right now/);
  });
});
