import { randomBytes, randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AiStreamOptions } from "@/lib/ai";

// next/headers outside a request (a settable client IP), and Claude replaced by a recorder.
const mocks = vi.hoisted(() => ({
  ip: { value: "198.51.100.1" },
  aiOn: { value: true },
  generations: [] as { prompt: string; fallbackText: string }[],
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": mocks.ip.value }),
  cookies: async () => ({ get: () => undefined }),
}));
vi.mock("@/lib/ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai")>();
  return {
    ...actual,
    aiEnabled: () => mocks.aiOn.value,
    aiStream: (opts: AiStreamOptions) => {
      mocks.generations.push({ prompt: opts.messages[0]?.content ?? "", fallbackText: opts.fallbackText });
      return new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("CLAUDE PLAN"));
          controller.close();
        },
      });
    },
  };
});

import { claimPlanGeneration, PLAN_LIMITS } from "@/app/(marketing)/assessment/data";
import { POST } from "@/app/api/assessment/[token]/plan/route";
import { getDb, schema } from "@/db";
import {
  type AssessmentAnswers,
  buildOwnerNotification,
  computeAssessment,
  escapeMarkdownText,
  serializeAnswers,
  serializeSubmission,
} from "@/lib/assessment";
import { escapeMarkdown, markdownToEmailHtml } from "@/lib/email";

const answers: AssessmentAnswers = {
  role: "owner",
  focus: "business",
  industry: "professional-services",
  teamSize: "2-10",
  usage: "weekly",
  tools: ["chatgpt", "claude"],
  timeDrains: ["email", "writing", "data"],
  goal: "save-time",
  comfort: "3",
  timeline: "month",
  investment: "course",
};

/** A submission made with someone else's address: the CRM already knows "Maya Thompson" for it. */
async function submission(opts: { legacy?: boolean; plan?: string } = {}) {
  const db = await getDb();
  const [contact] = await db
    .insert(schema.contacts)
    .values({ email: `maya-${randomUUID().slice(0, 8)}@example.com`, name: "Maya Thompson", company: "Thompson Holdings" })
    .returning();
  const result = computeAssessment(answers);
  const token = randomBytes(16).toString("hex");
  const [row] = await db
    .insert(schema.quizSubmissions)
    .values({
      contactId: contact.id,
      answers: opts.legacy ? serializeAnswers(answers) : serializeSubmission(answers, { name: "Visitor Test" }),
      score: result.score,
      tier: result.tier.id,
      recommendation: result.recommendation,
      resultToken: token,
      plan: opts.plan ?? null,
    })
    .returning();
  return { id: row.id, token };
}

async function requestPlan(token: string): Promise<{ status: number; body: string }> {
  const res = await POST(new Request(`http://localhost/api/assessment/${token}/plan`, { method: "POST" }), { params: Promise.resolve({ token }) });
  return { status: res.status, body: await res.text() };
}

/** Lets the single-flight lease lapse, as it does 90 seconds after a generation starts. */
async function expireLease(submissionId: string) {
  const db = await getDb();
  await db
    .update(schema.rateLimits)
    .set({ windowStart: new Date(Date.now() - (PLAN_LIMITS.leaseSec + 5) * 1000) })
    .where(eq(schema.rateLimits.key, `assessment-plan:lease:${submissionId}`));
}

async function rateLimitRows(submissionId: string) {
  const db = await getDb();
  return db.select().from(schema.rateLimits).where(like(schema.rateLimits.key, `%${submissionId}%`));
}

const isFallbackPlan = (body: string) => body.includes("## Your AI snapshot");

let ipCounter = 0;
beforeEach(() => {
  mocks.generations.length = 0;
  mocks.aiOn.value = true;
  ipCounter += 1;
  mocks.ip.value = `198.51.100.${ipCounter}`;
});

describe("plan generation budget", () => {
  it("starts one Claude generation at a time per submission", async () => {
    const { token } = await submission();
    const [a, b] = await Promise.all([requestPlan(token), requestPlan(token)]);
    expect(mocks.generations).toHaveLength(1);
    expect([a.body, b.body].filter((body) => body === "CLAUDE PLAN")).toHaveLength(1);
    // The other request still gets a complete plan: the deterministic one.
    expect([a.body, b.body].filter(isFallbackPlan)).toHaveLength(1);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });

  it("caps Claude generations per submission, then serves the standard plan", async () => {
    const { id, token } = await submission();
    for (let i = 0; i < PLAN_LIMITS.perSubmissionPerDay; i++) {
      await expireLease(id);
      expect((await requestPlan(token)).body).toBe("CLAUDE PLAN");
    }
    await expireLease(id);
    const capped = await requestPlan(token);
    expect(capped.status).toBe(200);
    expect(isFallbackPlan(capped.body)).toBe(true);
    expect(mocks.generations).toHaveLength(PLAN_LIMITS.perSubmissionPerDay);
  });

  it("caps Claude generations per IP address per day", async () => {
    const db = await getDb();
    await db.insert(schema.rateLimits).values({ key: `assessment-plan:day:${mocks.ip.value}`, count: PLAN_LIMITS.perIpPerDay, windowStart: new Date() });
    const { token } = await submission();
    const res = await requestPlan(token);
    expect(isFallbackPlan(res.body)).toBe(true);
    expect(mocks.generations).toHaveLength(0);

    const { id } = await submission();
    expect(await claimPlanGeneration(id, async () => ({ ok: false }))).toEqual({ ok: false, reason: "ip_limit" });
  });

  it("stops Claude generations site-wide once the daily ceiling is reached", async () => {
    const db = await getDb();
    const key = "assessment-plan:global";
    const [existing] = await db.select().from(schema.rateLimits).where(eq(schema.rateLimits.key, key));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      await db
        .insert(schema.rateLimits)
        .values({ key, count: PLAN_LIMITS.globalPerDay, windowStart: new Date() })
        .onConflictDoUpdate({ target: schema.rateLimits.key, set: { count: PLAN_LIMITS.globalPerDay, windowStart: new Date() } });
      const { token } = await submission();
      const res = await requestPlan(token);
      expect(isFallbackPlan(res.body)).toBe(true);
      expect(mocks.generations).toHaveLength(0);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("daily AI plan limit"));
    } finally {
      warn.mockRestore();
      if (existing) await db.update(schema.rateLimits).set(existing).where(eq(schema.rateLimits.key, key));
      else await db.delete(schema.rateLimits).where(eq(schema.rateLimits.key, key));
    }
  });

  it("serves a stored plan without claiming a generation", async () => {
    const { id, token } = await submission({ plan: "## Stored plan" });
    expect((await requestPlan(token)).body).toBe("## Stored plan");
    expect(mocks.generations).toHaveLength(0);
    expect(await rateLimitRows(id)).toHaveLength(0);
  });

  it("doesn't spend the budget when AI isn't configured (the plan is the deterministic one)", async () => {
    mocks.aiOn.value = false;
    const { id, token } = await submission();
    await requestPlan(token);
    await requestPlan(token);
    expect(mocks.generations).toHaveLength(2);
    expect(await rateLimitRows(id)).toHaveLength(0);
  });
});

describe("whose details the plan uses", () => {
  it("uses the name entered with the submission, never the CRM contact's stored name or company", async () => {
    const { token } = await submission();
    await requestPlan(token);
    const [generation] = mocks.generations;
    expect(generation.prompt).toContain("First name: Visitor");
    expect(generation.fallbackText).toContain("Visitor, you scored");
    expect(generation.fallbackText).toContain("name=Visitor+Test");
    for (const text of [generation.prompt, generation.fallbackText]) {
      expect(text).not.toContain("Maya");
      expect(text).not.toContain("Thompson");
    }
  });

  it("uses no name at all for submissions stored before names were kept", async () => {
    const { token } = await submission({ legacy: true });
    await requestPlan(token);
    const [generation] = mocks.generations;
    expect(generation.prompt).toContain("First name: (not given)");
    expect(generation.fallbackText).not.toContain("Maya");
    expect(generation.fallbackText).not.toContain("name=");
  });
});

describe("owner notification", () => {
  it("never turns visitor-typed values into links", () => {
    const result = computeAssessment(answers);
    const note = buildOwnerNotification({
      name: "see https://example.org/page",
      email: "[open](https://example.org/x)@example.com",
      company: "www.example.org",
      answers,
      result,
      resultsUrl: "https://x.test/r",
    });
    const html = markdownToEmailHtml(note);
    // Only the results-page link survives; everything the visitor typed reads as plain text.
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain('<a href="https://x.test/r">View their results page</a>');
    expect(html).not.toContain('href="https://example.org');
    expect(html).toContain("[open](https://example.org/x)@example.com");
    expect(html).toContain("www.example.org");
  });

  it("escapes exactly like the server-side escapeMarkdown", () => {
    for (const text of ["[a](b) <i>x</i> **y** _z_ `c`", "https://evil.example/x?y=1#z", "me@evil.com", "line\n\n\n\nbreak", "plain name"]) {
      expect(escapeMarkdownText(text)).toBe(escapeMarkdown(text));
    }
  });
});
