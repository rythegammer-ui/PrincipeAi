import { beforeAll, describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import {
  FUNNELS,
  computeFunnel,
  displayPath,
  formatPercent,
  getAttribution,
  getEntrances,
  getTraffic,
  normalizeReferrerHost,
  parseRangeDays,
  rangeFor,
  rate,
  referrerHost,
  summarizeFunnel,
  type FunnelDef,
} from "@/lib/funnels";
import { FUNNEL_EVENTS } from "@/lib/tracking";

describe("funnel definitions", () => {
  it("defines the four funnels with the expected steps", () => {
    const byId = Object.fromEntries(FUNNELS.map((f) => [f.id, f.steps.map((s) => s.event)]));
    expect(byId["free-guide"]).toEqual(["page_view", "optin", "guide_viewed", "booking_created", "purchase"]);
    expect(byId.assessment).toEqual(["page_view", "quiz_started", "quiz_completed", "booking_created", "purchase"]);
    expect(byId["course-sales"]).toEqual(["page_view", "checkout_started", "purchase"]);
    expect(byId.booking).toEqual(["booking_viewed", "booking_created"]);
    expect(FUNNELS.find((f) => f.id === "free-guide")?.steps[0].path).toBe("/free-guide");
    expect(FUNNELS.find((f) => f.id === "course-sales")?.steps[0].pathPrefix).toBe("/courses");
  });

  it("only uses known event names and unique keys", () => {
    expect(new Set(FUNNELS.map((f) => f.id)).size).toBe(FUNNELS.length);
    for (const f of FUNNELS) {
      expect(new Set(f.steps.map((s) => s.key)).size).toBe(f.steps.length);
      for (const s of f.steps) expect(FUNNEL_EVENTS).toContain(s.event);
    }
  });
});

describe("rate math", () => {
  it("computes rates and guards against empty denominators", () => {
    expect(rate(1, 4)).toBe(0.25);
    expect(rate(0, 10)).toBe(0);
    expect(rate(3, 0)).toBeNull();
    expect(rate(Number.NaN, 4)).toBeNull();
  });

  it("formats percentages for humans", () => {
    expect(formatPercent(0.4213)).toBe("42%");
    expect(formatPercent(0.042)).toBe("4.2%");
    expect(formatPercent(0.0004)).toBe("<0.1%");
    expect(formatPercent(0)).toBe("0%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(null)).toBe("—");
  });

  it("summarises step + overall conversion, drop-off and the biggest drop", () => {
    const def = FUNNELS[0];
    const r = summarizeFunnel(def, [200, 80, 60, 6, 2]);
    expect(r.entered).toBe(200);
    expect(r.completed).toBe(2);
    expect(r.overallRate).toBe(0.01);
    expect(r.steps.map((s) => s.stepRate)).toEqual([null, 0.4, 0.75, 0.1, 2 / 6]);
    expect(r.steps.map((s) => s.overallRate)).toEqual([1, 0.4, 0.3, 0.03, 0.01]);
    expect(r.steps.map((s) => s.dropOff)).toEqual([0, 120, 20, 54, 4]);
    expect(r.steps[1].dropRate).toBeCloseTo(0.6);
    // 60 → 6 is a 90% drop: the steepest.
    expect(r.biggestDropIndex).toBe(3);
  });

  it("breaks drop-rate ties by the number of people lost", () => {
    const def: FunnelDef = { id: "t", name: "t", description: "", href: "/", steps: FUNNELS[0].steps.slice(0, 3) };
    expect(summarizeFunnel(def, [100, 50, 25]).biggestDropIndex).toBe(1);
  });

  it("handles empty funnels and clamps impossible counts", () => {
    const empty = summarizeFunnel(FUNNELS[3], [0, 0]);
    expect(empty.overallRate).toBeNull();
    expect(empty.biggestDropIndex).toBeNull();
    expect(empty.steps[1].stepRate).toBeNull();
    const clamped = summarizeFunnel(FUNNELS[3], [5, 9]);
    expect(clamped.steps[1].count).toBe(5);
    expect(clamped.biggestDropIndex).toBeNull();
    const missing = summarizeFunnel(FUNNELS[2], [4]);
    expect(missing.steps.map((s) => s.count)).toEqual([4, 0, 0]);
    expect(missing.biggestDropIndex).toBe(1);
  });
});

describe("ranges, referrers and paths", () => {
  it("parses the range selector", () => {
    expect(parseRangeDays("7")).toBe(7);
    expect(parseRangeDays(["90"])).toBe(90);
    expect(parseRangeDays("365")).toBe(30);
    expect(parseRangeDays(undefined)).toBe(30);
  });

  it("builds calendar-day ranges in the business timezone", () => {
    const now = new Date("2026-10-18T03:30:00Z"); // 23:30 on Oct 17 in New York
    const r = rangeFor(7, "America/New_York", now);
    expect(r.dayKeys).toHaveLength(7);
    expect(r.dayKeys[0]).toBe("2026-10-11");
    expect(r.dayKeys[6]).toBe("2026-10-17");
    expect(r.from.toISOString()).toBe("2026-10-11T04:00:00.000Z");
    expect(r.to).toBe(now);
    expect(rangeFor(1, "Not/AZone", now).tz).toBe("UTC");
  });

  it("normalises referrer domains", () => {
    expect(normalizeReferrerHost("WWW.Google.com.")).toBe("google.com");
    expect(normalizeReferrerHost("l.instagram.com")).toBe("instagram.com");
    expect(normalizeReferrerHost("m.facebook.com")).toBe("facebook.com");
    expect(normalizeReferrerHost("bad host")).toBeNull();
    expect(referrerHost("https://www.youtube.com/watch?v=1")).toBe("youtube.com");
    expect(referrerHost("not a url")).toBeNull();
    expect(referrerHost(null)).toBeNull();
  });

  it("hides secret tokens in report paths", () => {
    expect(displayPath("/unsubscribe/abc123")).toBe("/unsubscribe/…");
    expect(displayPath("/booking/tok/reschedule")).toBe("/booking/…/reschedule");
    expect(displayPath("/courses/ai-essentials")).toBe("/courses/ai-essentials");
    expect(displayPath(null)).toBe("(unknown)");
  });
});

describe("funnel SQL on synthetic events", () => {
  // A window far from "now" so seeded or other tests' data can't interfere.
  const now = new Date("2031-03-07T12:00:00Z");
  const range = rangeFor(7, "UTC", now);
  const at = (day: number, minutes = 0) => new Date(Date.UTC(2031, 2, day, 9, minutes));
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    const db = await getDb();
    const stamp = Date.now().toString(36);
    const contacts = await db
      .insert(schema.contacts)
      .values([
        { email: `f1-${stamp}@example.com`, source: "lead_magnet", utm: { source: "google" }, createdAt: at(1, 5) },
        { email: `f2-${stamp}@example.com`, source: "lead_magnet", utm: {}, createdAt: at(2, 5) },
        { email: `f3-${stamp}@example.com`, source: "checkout", utm: { source: "Instagram" }, createdAt: at(3) },
      ])
      .returning({ id: schema.contacts.id });
    [ids.c1, ids.c2, ids.c3] = contacts.map((c) => c.id);
    const v = (n: number) => `t-${stamp}-v${n}`;
    const ev = (visitorId: string, name: string, createdAt: Date, extra: Partial<typeof schema.events.$inferInsert> = {}) => ({ visitorId, name, createdAt, ...extra });

    await db.insert(schema.events).values([
      // v1: the full journey. Client events carry the cookie; purchase/booking come from the server with no cookie.
      ev(v(1), "page_view", at(1), { path: "/free-guide", referrer: "https://www.google.com/search?q=ai" }),
      ev(v(1), "optin", at(1, 5), { path: "/free-guide", contactId: ids.c1 }),
      ev(v(1), "guide_viewed", at(1, 6), { path: "/guide" }),
      ev(`contact:${ids.c1}`, "booking_created", at(2), { contactId: ids.c1 }),
      ev(`contact:${ids.c1}`, "purchase", at(3), { contactId: ids.c1 }),
      // v2: opted in but never opened the guide.
      ev(v(2), "page_view", at(2), { path: "/free-guide", referrer: "https://l.instagram.com/" }),
      ev(v(2), "optin", at(2, 5), { path: "/free-guide", contactId: ids.c2 }),
      // v3: viewed the guide without opting in (skipped a step → stops at step 1).
      ev(v(3), "page_view", at(3), { path: "/free-guide" }),
      ev(v(3), "guide_viewed", at(3, 2), { path: "/guide" }),
      // v4: opted in BEFORE visiting the landing page (out of order → only step 1).
      ev(v(4), "optin", at(4), { path: "/free-guide" }),
      ev(v(4), "page_view", at(4, 30), { path: "/free-guide" }),
      // v5: a different page; v6: outside the range.
      ev(v(5), "page_view", at(4), { path: "/free-guide-old" }),
      ev(v(6), "page_view", new Date(Date.UTC(2031, 1, 1)), { path: "/free-guide" }),
      // v7: course buyer (cookie linked to c3 via contacts.visitor_id below); v8 near-miss path.
      ev(v(7), "page_view", at(5), { path: "/courses/ai-essentials" }),
      ev(v(7), "checkout_started", at(5, 3), { path: "/courses/ai-essentials" }),
      ev(`contact:${ids.c3}`, "purchase", at(5, 9), { contactId: ids.c3 }),
      ev(v(8), "page_view", at(5), { path: "/coursesx" }),
      ev(v(8), "checkout_started", at(5, 1), { path: "/coursesx" }),
    ]);
    // c3 was identified on an earlier visit: only contacts.visitor_id links their cookie.
    const { eq } = await import("drizzle-orm");
    await db.update(schema.contacts).set({ visitorId: v(7) }).where(eq(schema.contacts.id, ids.c3));

    const [mt] = await db.select().from(schema.meetingTypes).limit(1);
    await db.insert(schema.bookings).values({
      meetingTypeId: mt.id,
      contactId: ids.c1,
      startAt: at(6),
      endAt: at(6, 30),
      timezone: "UTC",
      status: "confirmed",
      createdAt: at(2),
    });
    await db.insert(schema.orders).values([
      { contactId: ids.c1, email: "f1@example.com", itemType: "course", description: "Course", amountCents: 4700, status: "paid", paidAt: at(3), createdAt: at(3), isTest: true },
      { contactId: ids.c3, email: "f3@example.com", itemType: "course", description: "Course", amountCents: 19700, status: "paid", paidAt: at(5, 9), createdAt: at(5) },
      { contactId: ids.c3, email: "f3@example.com", itemType: "course", description: "Course", amountCents: 9900, status: "pending", createdAt: at(5) },
    ]);
  });

  it("counts people only when they hit every earlier step in order", async () => {
    const freeGuide = await computeFunnel(FUNNELS.find((f) => f.id === "free-guide")!, range);
    expect(freeGuide.steps.map((s) => s.count)).toEqual([4, 2, 1, 1, 1]);
    expect(freeGuide.overallRate).toBe(0.25);
    // 4 → 2 and 2 → 1 are both 50% drops; the tie goes to the step that lost more people.
    expect(freeGuide.biggestDropIndex).toBe(1);
  });

  it("matches path prefixes on segment boundaries and chains cookie-less server events", async () => {
    const courses = await computeFunnel(FUNNELS.find((f) => f.id === "course-sales")!, range);
    expect(courses.steps.map((s) => s.count)).toEqual([1, 1, 1]);
  });

  it("reports traffic, entrances and first-touch attribution", async () => {
    const traffic = await getTraffic(range);
    expect(traffic.dayKeys).toEqual(range.dayKeys);
    expect(traffic.totalPageViews).toBe(7);
    expect(traffic.totalVisitors).toBe(7);
    expect(traffic.pageViews[0]).toBe(1);

    const entrances = await getEntrances(range);
    const page = entrances.landingPages.find((p) => p.key === "/free-guide");
    // v1 + v2 identified themselves; v4's (cookie-only) opt-in also counts as a lead.
    expect(page).toMatchObject({ visitors: 4, leads: 3 });
    expect(entrances.referrers.find((r) => r.key === "google.com")).toMatchObject({ visitors: 1, leads: 1 });
    expect(entrances.referrers.find((r) => r.key === "instagram.com")).toMatchObject({ visitors: 1, leads: 1 });

    const attribution = await getAttribution(range);
    expect(attribution.bySource.find((r) => r.key === "lead_magnet")).toMatchObject({ leads: 2, bookedCalls: 1, customers: 1, revenueCents: 4700 });
    expect(attribution.bySource.find((r) => r.key === "checkout")).toMatchObject({ leads: 1, customers: 1, revenueCents: 19700 });
    expect(attribution.byChannel.find((r) => r.key === "instagram")).toMatchObject({ leads: 1, revenueCents: 19700 });
    expect(attribution.byChannel.find((r) => r.key === "direct")).toMatchObject({ leads: 1, revenueCents: 0 });
    expect(attribution.totals).toEqual({ leads: 3, bookedCalls: 1, customers: 2, revenueCents: 24400 });
    expect(attribution.testOrders).toBe(1);
  });
});
