import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Run the admin server action outside a request: signed in, with redirect() observable.
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  assertAdmin: async () => ({ sub: "admin", role: "admin", email: "admin@example.com" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

import { deleteContactAction } from "@/app/admin/(panel)/contacts/actions";
import { getDb, schema } from "@/db";
import { upsertContact } from "@/lib/crm";
import { PENDING_ORDER_TTL_MS } from "@/lib/jobs";

const HOUR = 3_600_000;
let paidTypeId: string;

async function contact() {
  const { contact } = await upsertContact({ email: `delete-${randomUUID().slice(0, 8)}@example.com`, name: "Dee Lete", source: "manual" });
  return contact;
}

async function exists(id: string) {
  const db = await getDb();
  return (await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.id, id))).length === 1;
}

async function hold(contactId: string, holdExpiresAt: Date) {
  const db = await getDb();
  const start = new Date(Date.now() + 5 * 24 * HOUR + Math.floor(Math.random() * 1000) * HOUR);
  const [booking] = await db
    .insert(schema.bookings)
    .values({ meetingTypeId: paidTypeId, contactId, startAt: start, endAt: new Date(start.getTime() + HOUR), timezone: "UTC", status: "pending_payment", holdExpiresAt })
    .returning();
  return booking;
}

describe("deleting a contact", () => {
  beforeAll(async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const db = await getDb();
    const [paid] = await db.select({ id: schema.meetingTypes.id }).from(schema.meetingTypes).where(sql`${schema.meetingTypes.priceCents} > 0`).limit(1);
    paidTypeId = paid.id;
  });

  it("is refused while the contact has an unpaid booking hold that can still be paid", async () => {
    const c = await contact();
    await hold(c.id, new Date(Date.now() + 20 * 60_000));
    const result = await deleteContactAction(c.id);
    expect(result).toMatchObject({ ok: false, error: expect.stringContaining("checkout in progress") });
    expect(await exists(c.id)).toBe(true);
  });

  it("is refused while a recent checkout order is pending", async () => {
    const c = await contact();
    const db = await getDb();
    await db.insert(schema.orders).values({ contactId: c.id, email: c.email, itemType: "course", description: "AI Essentials", amountCents: 4700, status: "pending" });
    expect(await deleteContactAction(c.id)).toMatchObject({ ok: false });
    expect(await exists(c.id)).toBe(true);
  });

  it("goes ahead once the hold has lapsed and old checkouts are stale", async () => {
    const c = await contact();
    await hold(c.id, new Date(Date.now() - 60_000));
    const db = await getDb();
    await db.insert(schema.orders).values({
      contactId: c.id,
      email: c.email,
      itemType: "course",
      description: "AI Essentials",
      amountCents: 4700,
      status: "pending",
      createdAt: new Date(Date.now() - PENDING_ORDER_TTL_MS - HOUR),
    });
    await expect(deleteContactAction(c.id)).rejects.toThrow("REDIRECT /admin/contacts?deleted=1");
    expect(await exists(c.id)).toBe(false);
  });
});
