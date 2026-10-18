import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  PLACEHOLDERS,
  TRIGGERS,
  describeStepTiming,
  fallbackStepDraft,
  formatDelay,
  humanizeKind,
  maskEmail,
  parseStepDraft,
  stepDays,
  triggerLabel,
} from "@/components/funnels/automation-utils";
import { getDb, schema } from "@/db";
import { seedSequences } from "@/db/seed-content/sequences";
import { authorizeCron, runScheduledJobs } from "@/lib/jobs";

const KNOWN = new Set<string>(PLACEHOLDERS.map((p) => p.key));
const placeholdersIn = (text: string) => [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]);

describe("default sequences", () => {
  const byTrigger = Object.fromEntries(seedSequences.map((s) => [s.trigger, s]));

  it("ships one sequence per automatic trigger with the planned number of emails", () => {
    expect(byTrigger.lead_magnet.name).toBe("Free Guide Nurture");
    expect(byTrigger.lead_magnet.steps).toHaveLength(6);
    expect(byTrigger.quiz_completed.steps).toHaveLength(4);
    expect(byTrigger.call_booked.steps).toHaveLength(2);
    expect(byTrigger.purchase.steps).toHaveLength(3);
    expect(byTrigger.contact_form.steps).toHaveLength(1);
    expect(byTrigger.contact_form.steps[0].delayHours).toBe(0);
    expect(byTrigger.lead_magnet.steps[0].delayHours).toBe(0);
  });

  it("spreads the free guide nurture over about 12 days", () => {
    const days = stepDays(byTrigger.lead_magnet.steps.map((s) => s.delayHours));
    expect(days[0]).toBe(0);
    expect(days.at(-1)).toBe(12);
    expect(stepDays(byTrigger.purchase.steps.map((s) => s.delayHours))).toEqual([0, 3, 7]);
  });

  it("uses only supported placeholders and a call to action in every email", () => {
    for (const seq of seedSequences) {
      for (const step of seq.steps) {
        for (const key of [...placeholdersIn(step.subject), ...placeholdersIn(step.body)]) expect(KNOWN, `${seq.name}: ${key}`).toContain(key);
        expect(step.subject.length).toBeLessThanOrEqual(200);
        // One clear call to action: a placeholder link, or an invitation to reply.
        expect(step.body).toMatch(/\]\(\{\{\w+\}\}|just reply to this email/i);
      }
    }
    expect(byTrigger.lead_magnet.steps[0].body).toContain("{{guideUrl}}");
    expect(byTrigger.lead_magnet.steps[4].body).toContain("{{assessmentUrl}}");
    expect(byTrigger.purchase.steps[0].body).toContain("{{loginUrl}}");
  });
});

describe("automation helpers", () => {
  it("describes delays in plain English", () => {
    expect(formatDelay(0)).toBe("immediately");
    expect(formatDelay(1)).toBe("1 hour");
    expect(formatDelay(24)).toBe("1 day");
    expect(formatDelay(26)).toBe("1 day 2 hours");
    expect(formatDelay(72)).toBe("3 days");
    expect(describeStepTiming(0, 0)).toBe("Sends as soon as someone joins");
    expect(describeStepTiming(2, 48)).toBe("Sends 2 days after the previous email");
  });

  it("labels triggers and email kinds", () => {
    expect(TRIGGERS).toContain("manual");
    expect(triggerLabel("lead_magnet")).toBe("Downloads the free guide");
    expect(triggerLabel("unknown")).toBe("unknown");
    expect(humanizeKind("booking_confirmation")).toBe("Booking confirmation");
  });

  it("masks emails without revealing their length", () => {
    expect(maskEmail("alex.rivera@gmail.com")).toBe("al•••@g•••.com");
    expect(maskEmail("jo@example.co.uk")).toBe("j•••@e•••.uk");
    expect(maskEmail("nobody")).toBe("•••");
  });

  it("parses AI drafts in several shapes", () => {
    expect(parseStepDraft("SUBJECT: Your first AI win\nBODY:\nHi {{firstName}},\n\nTry this prompt today.")).toEqual({
      subject: "Your first AI win",
      body: "Hi {{firstName}},\n\nTry this prompt today.",
    });
    expect(parseStepDraft('```json\n{"subject":"\\"Quick idea\\"","body":"Hi {{firstName}}, here is a quick idea for you."}\n```')).toEqual({
      subject: "Quick idea",
      body: "Hi {{firstName}}, here is a quick idea for you.",
    });
    expect(parseStepDraft("**Subject:** Hello there\n\n**Body:**\nA body that is long enough to keep.")).toEqual({
      subject: "Hello there",
      body: "A body that is long enough to keep.",
    });
    expect(parseStepDraft("Subject: Hello\n\nShort")).toBeNull();
    expect(parseStepDraft("Just some text without structure")).toBeNull();
    expect(parseStepDraft(null)).toBeNull();
  });

  it("offers a sensible fallback draft for every trigger and position", () => {
    for (const trigger of TRIGGERS) {
      for (const [i, total] of [
        [0, 1],
        [1, 3],
        [2, 3],
      ]) {
        const d = fallbackStepDraft(trigger, i, total);
        expect(d.subject.length).toBeGreaterThan(5);
        expect(d.body).toContain("{{firstName}}");
        for (const key of placeholdersIn(d.subject + d.body)) expect(KNOWN).toContain(key);
      }
    }
    expect(fallbackStepDraft("lead_magnet", 0, 4).body).toContain("{{guideUrl}}");
    expect(fallbackStepDraft("quiz_completed", 3, 4).body).toContain("{{bookUrl}}");
  });
});

describe("scheduled jobs", () => {
  it("expires stale checkouts, clears old rate limits + login tokens and reports every job", async () => {
    const db = await getDb();
    const old = new Date(Date.now() - 3 * 24 * 3_600_000);
    const key = `test-job-${Date.now()}`;
    const [stale] = await db
      .insert(schema.orders)
      .values({ email: "jobs@example.com", itemType: "course", description: "Course", amountCents: 1000, status: "pending", createdAt: old })
      .returning();
    const [fresh] = await db
      .insert(schema.orders)
      .values({ email: "jobs@example.com", itemType: "course", description: "Course", amountCents: 1000, status: "pending" })
      .returning();
    await db.insert(schema.rateLimits).values([
      { key: `${key}-old`, count: 3, windowStart: old },
      { key: `${key}-new`, count: 1 },
    ]);
    await db.insert(schema.loginTokens).values([
      { tokenHash: `${key}-old`, email: "jobs@example.com", expiresAt: new Date(Date.now() - 8 * 24 * 3_600_000) },
      { tokenHash: `${key}-new`, email: "jobs@example.com", expiresAt: new Date(Date.now() - 3_600_000) },
    ]);

    const summary = await runScheduledJobs();
    expect(Object.keys(summary.jobs)).toEqual(["automations", "bookingReminders", "expiredHolds", "expiredOrders", "rateLimits", "loginTokens"]);
    expect(summary.ok).toBe(true);

    const status = async (id: string) => (await db.select().from(schema.orders).where(eq(schema.orders.id, id)))[0].status;
    expect(await status(stale.id)).toBe("expired");
    expect(await status(fresh.id)).toBe("pending");
    const limits = await db.select().from(schema.rateLimits);
    expect(limits.map((r) => r.key)).toContain(`${key}-new`);
    expect(limits.map((r) => r.key)).not.toContain(`${key}-old`);
    const tokens = await db.select().from(schema.loginTokens);
    expect(tokens.map((t) => t.tokenHash)).toContain(`${key}-new`);
    expect(tokens.map((t) => t.tokenHash)).not.toContain(`${key}-old`);
  });
});

describe("cron authorization", () => {
  it("requires the bearer secret when CRON_SECRET is set", () => {
    expect(authorizeCron("Bearer s3cret-value", "s3cret-value", "production")).toEqual({ ok: true });
    expect(authorizeCron("Bearer wrong", "s3cret-value", "production").ok).toBe(false);
    expect(authorizeCron("s3cret-value", "s3cret-value", "development").ok).toBe(false);
    expect(authorizeCron(null, "s3cret-value", "development").ok).toBe(false);
  });

  it("only allows unauthenticated runs outside production", () => {
    expect(authorizeCron(null, undefined, "development")).toEqual({ ok: true });
    expect(authorizeCron(null, "", "test")).toEqual({ ok: true });
    expect(authorizeCron("Bearer anything", undefined, "production").ok).toBe(false);
  });
});
