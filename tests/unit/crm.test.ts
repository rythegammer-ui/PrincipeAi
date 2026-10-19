import { eq, inArray, sql } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { csvCell, parseDollarsToCents, safeWebsiteUrl, scoreBreakdown, toCsv } from "@/components/admin/crm-utils";
import { getDb, schema } from "@/db";
import type { BookingStatus } from "@/db/schema";
import { seedDemoData } from "@/db/seed-demo";
import { parseEmailDraft, ruleBasedSummary } from "@/lib/ai-crm";
import { CHECKOUT_FAILED_REASON, HOLD_EXPIRED_REASON } from "@/lib/booking-service";
import { advanceStage, logActivity, recomputeScore, setStage, upsertContact } from "@/lib/crm";
import {
  contactFacets,
  exportContacts,
  getContact360,
  getDashboard,
  getPipelineBoard,
  getTaskBoard,
  listContacts,
  parseContactFilters,
  parsePipelineFilters,
} from "@/lib/crm-queries";

describe("CSV export", () => {
  it("escapes commas, quotes and newlines (RFC 4180)", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("neutralises spreadsheet formula injection", () => {
    expect(csvCell("=HYPERLINK(\"http://evil\")")).toBe("\"'=HYPERLINK(\"\"http://evil\"\")\"");
    expect(csvCell("+1 555 0100")).toBe("'+1 555 0100");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
    expect(csvCell("\rcmd")).toBe("\"'\rcmd\"");
    expect(csvCell("a=b")).toBe("a=b");
  });

  it("keeps numbers, booleans, dates and arrays typed", () => {
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(1500.5)).toBe("1500.5");
    expect(csvCell(Number.NaN)).toBe("");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(new Date("2026-01-02T03:04:05.000Z"))).toBe("2026-01-02T03:04:05.000Z");
    expect(csvCell(["vip", "=evil"])).toBe("vip; =evil");
    expect(csvCell(["=evil", "vip"])).toBe("'=evil; vip");
  });

  it("builds a CRLF document with a header row", () => {
    expect(toCsv(["email", "name"], [["a@x.com", "Ann, Jr."], ["b@x.com", null]])).toBe('email,name\r\na@x.com,"Ann, Jr."\r\nb@x.com,\r\n');
  });
});

describe("pure helpers", () => {
  it("parses dollar amounts into cents", () => {
    expect(parseDollarsToCents("1,500")).toBe(150000);
    expect(parseDollarsToCents("$997.50")).toBe(99750);
    expect(parseDollarsToCents("")).toBe(0);
    expect(parseDollarsToCents("-5")).toBeNull();
    expect(parseDollarsToCents("abc")).toBeNull();
  });

  it("only links to http(s) websites", () => {
    expect(safeWebsiteUrl("example.com")).toBe("https://example.com/");
    expect(safeWebsiteUrl("http://shop.example.com/a")).toBe("http://shop.example.com/a");
    expect(safeWebsiteUrl("javascript:alert(1)")).toBeNull();
    expect(safeWebsiteUrl("localhost")).toBeNull();
  });

  it("validates contact filters from search params", () => {
    const f = parseContactFilters({ q: "  ann  ", stage: "bogus", source: "lead_magnet", tag: "VIP", minScore: "500", sort: "score", page: "-3" });
    expect(f).toMatchObject({ q: "ann", stage: undefined, source: "lead_magnet", tag: "vip", minScore: undefined, sort: "score", page: 1 });
    expect(parseContactFilters(new URLSearchParams("stage=customer&segment=none&minScore=60"))).toMatchObject({ stage: "customer", segment: "none", minScore: 60, sort: "newest" });
    expect(parsePipelineFilters({ q: ["a", "b"], segment: "business" })).toEqual({ q: "a", segment: "business", minScore: undefined });
  });

  it("parses AI email drafts defensively", () => {
    expect(parseEmailDraft("SUBJECT: Quick idea for you\nBODY:\nHi Ann,\n\nHere is the idea.")).toEqual({ subject: "Quick idea for you", body: "Hi Ann,\n\nHere is the idea." });
    expect(parseEmailDraft('```json\n{"subject":"Hello","body":"A longer body text here."}\n```')).toEqual({ subject: "Hello", body: "A longer body text here." });
    expect(parseEmailDraft("Subject: Next steps\n\nHi Sam, thanks for the call today.")).toEqual({ subject: "Next steps", body: "Hi Sam, thanks for the call today." });
    expect(parseEmailDraft("I can't help with that.")).toBeNull();
  });
});

describe("lead scoring + stages (embedded DB)", () => {
  it("recomputeScore matches the explained breakdown and applies caps", async () => {
    const { contact } = await upsertContact({ email: "score.test@example.com", name: "Score Test", phone: "+1 555 0100", source: "manual" });
    await logActivity(contact.id, "optin", "Downloaded guide");
    await logActivity(contact.id, "quiz_completed", "Assessment", { meta: { scoreBoost: 12 } });
    await logActivity(contact.id, "booking_created", "Booked");
    await logActivity(contact.id, "booking_created", "Booked again");
    const score = await recomputeScore(contact.id);
    // name 3 + phone 5 + opt-in 10 + quiz 15 + boost 12 + bookings min(30, 50)
    expect(score).toBe(75);
    const db = await getDb();
    const acts = await db.select({ type: schema.activities.type, meta: schema.activities.meta }).from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    const [row] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contact.id));
    expect(row.score).toBe(75);
    expect(scoreBreakdown(row, acts).total).toBe(75);

    await db.update(schema.contacts).set({ unsubscribed: true }).where(eq(schema.contacts.id, contact.id));
    expect(await recomputeScore(contact.id)).toBe(65);

    for (let i = 0; i < 3; i++) await logActivity(contact.id, "purchase", "Purchase");
    await db.update(schema.contacts).set({ company: "Acme", unsubscribed: false }).where(eq(schema.contacts.id, contact.id));
    const capped = await recomputeScore(contact.id);
    expect(capped).toBe(100);
    const acts2 = await db.select({ type: schema.activities.type, meta: schema.activities.meta }).from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    const [row2] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contact.id));
    expect(scoreBreakdown(row2, acts2).total).toBe(capped);
  });

  it("advanceStage only moves forward; lost contacts can re-enter; setStage logs", async () => {
    const db = await getDb();
    const { contact } = await upsertContact({ email: "stage.test@example.com", source: "manual" });
    const stageOf = async () => (await db.select({ s: schema.contacts.stage }).from(schema.contacts).where(eq(schema.contacts.id, contact.id)))[0].s;

    await advanceStage(contact.id, "qualified");
    expect(await stageOf()).toBe("qualified");
    await advanceStage(contact.id, "engaged");
    expect(await stageOf()).toBe("qualified");
    await advanceStage(contact.id, "qualified");
    expect(await stageOf()).toBe("qualified");

    await setStage(contact.id, "lost");
    expect(await stageOf()).toBe("lost");
    await advanceStage(contact.id, "engaged");
    expect(await stageOf()).toBe("engaged");

    const changes = await db
      .select({ meta: schema.activities.meta })
      .from(schema.activities)
      .where(sql`${schema.activities.contactId} = ${contact.id} and ${schema.activities.type} = 'stage_changed'`);
    expect(changes).toHaveLength(3);
    expect(changes.filter((c) => c.meta.auto === true)).toHaveLength(2);
  });
});

describe("demo seed + CRM queries", () => {
  let seedMs = 0;
  beforeAll(async () => {
    const db = await getDb();
    const started = performance.now();
    await seedDemoData(db);
    seedMs = performance.now() - started;
  });

  it("creates realistic, tagged sample data quickly", async () => {
    const db = await getDb();
    const sample = await db.select().from(schema.contacts).where(sql`${schema.contacts.tags} @> '["sample"]'::jsonb`);
    expect(sample).toHaveLength(45);
    expect(sample.every((c) => c.email.endsWith("@example.com"))).toBe(true);
    expect(new Set(sample.map((c) => c.stage)).size).toBe(7);
    expect(seedMs).toBeLessThan(4000);

    const orders = await db.select().from(schema.orders);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.every((o) => o.isTest && o.status === "paid")).toBe(true);
    const upcoming = await db.select().from(schema.bookings).where(sql`${schema.bookings.startAt} > now() and ${schema.bookings.status} = 'confirmed'`);
    expect(upcoming.length).toBeGreaterThanOrEqual(3);
    const quizzes = await db.select({ id: schema.quizSubmissions.id }).from(schema.quizSubmissions);
    expect(quizzes.length).toBeGreaterThanOrEqual(6);
    const chats = await db.select({ id: schema.chatConversations.id }).from(schema.chatConversations);
    expect(chats.length).toBeGreaterThanOrEqual(4);
    const overdue = await db.select({ id: schema.tasks.id }).from(schema.tasks).where(sql`${schema.tasks.completedAt} is null and ${schema.tasks.dueAt} < now()`);
    expect(overdue.length).toBeGreaterThan(0);

    // Seeded scores follow the same rules as recomputeScore().
    for (const c of sample.slice(0, 12)) expect(await recomputeScore(c.id)).toBe(c.score);
    // LTV equals the sum of paid orders.
    for (const c of sample.filter((s) => s.lifetimeValueCents > 0)) {
      const sum = orders.filter((o) => o.contactId === c.id).reduce((s, o) => s + o.amountCents, 0);
      expect(sum).toBe(c.lifetimeValueCents);
    }
  });

  it("runs every dashboard / list / pipeline / task / 360° query", async () => {
    const dash = await getDashboard(30);
    expect(dash.days).toHaveLength(30);
    expect(dash.kpis.leads.value).toBeGreaterThan(0);
    expect(dash.leadSeries.reduce((s, x) => s + x.values.reduce((a, b) => a + b, 0), 0)).toBe(dash.kpis.leads.value);
    expect(dash.pipelineSummary.reduce((s, p) => s + p.count, 0)).toBe(dash.totalContacts);
    expect(dash.upcoming.length).toBeGreaterThan(0);
    expect(dash.recent).toHaveLength(15);
    expect((await getDashboard(7)).days).toHaveLength(7);

    const list = await listContacts(parseContactFilters({ q: "example", sort: "score" }));
    expect(list.total).toBeGreaterThan(40);
    expect(list.rows[0].score).toBeGreaterThanOrEqual(list.rows[list.rows.length - 1].score);
    const tagged = await listContacts(parseContactFilters({ tag: "sample", stage: "customer" }));
    expect(tagged.rows.every((r) => r.stage === "customer" && r.tags.includes("sample"))).toBe(true);
    const escaped = await listContacts(parseContactFilters({ q: "%_" }));
    expect(escaped.total).toBe(0);
    const facets = await contactFacets();
    expect(facets.tags).toContain("sample");
    expect((await exportContacts(parseContactFilters({ minScore: "60" }))).every((r) => r.score >= 60)).toBe(true);

    const board = await getPipelineBoard(parsePipelineFilters({}));
    expect(board.cards.length).toBe(Object.values(board.totals).reduce((s, t) => s + t.count, 0));
    const tasks = await getTaskBoard();
    expect(tasks.overdue.length + tasks.today.length + tasks.upcoming.length + tasks.noDate.length).toBeGreaterThan(0);

    const db = await getDb();
    const [customer] = await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.stage, "customer")).limit(1);
    const c360 = await getContact360(customer.id);
    expect(c360?.orders.length).toBeGreaterThan(0);
    expect(c360?.activities.length).toBeGreaterThan(2);
    expect(c360?.eventSummary?.total).toBeGreaterThanOrEqual(0);
    const brief = ruleBasedSummary(c360!);
    expect(brief).toContain("**Next best action**");
  });

  it("counts booked calls without unpaid or abandoned payment holds", async () => {
    const db = await getDb();
    const [meetingType] = await db.select({ id: schema.meetingTypes.id }).from(schema.meetingTypes).limit(1);
    const [contact] = await db.select({ id: schema.contacts.id }).from(schema.contacts).limit(1);
    const before = await getDashboard(7);
    const start = new Date(Date.now() + 3 * 86_400_000);
    const end = new Date(start.getTime() + 30 * 60_000);
    const row = (status: BookingStatus, cancelReason: string | null = null) => ({
      meetingTypeId: meetingType.id,
      contactId: contact.id,
      startAt: start,
      endAt: end,
      timezone: "UTC",
      status,
      cancelReason,
      cancelledAt: status === "cancelled" ? new Date() : null,
    });
    const inserted = await db
      .insert(schema.bookings)
      .values([
        row("confirmed"),
        row("cancelled"), // cancelled by the invitee / admin with no reason → still a booked call
        row("cancelled", "Schedule conflict"),
        row("pending_payment"),
        row("cancelled", HOLD_EXPIRED_REASON),
        row("cancelled", CHECKOUT_FAILED_REASON),
      ])
      .returning({ id: schema.bookings.id });
    try {
      const after = await getDashboard(7);
      expect(after.kpis.calls.value - before.kpis.calls.value).toBe(3);
      const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
      expect(sum(after.kpis.calls.spark) - sum(before.kpis.calls.spark)).toBe(3);
      expect(after.kpis.calls.prev).toBe(before.kpis.calls.prev);
    } finally {
      await db.delete(schema.bookings).where(inArray(schema.bookings.id, inserted.map((r) => r.id)));
    }
  });
});
