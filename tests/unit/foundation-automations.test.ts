import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { processEnrollment, triggerAutomations } from "@/lib/automations";
import { setMarketingSubscription, upsertContact } from "@/lib/crm";
import { escapeMarkdown, markdownToEmailHtml, sendEmail } from "@/lib/email";

const PHISH = "[Reset-your-password](https://evil.example/reset)";

async function contactNamed(email: string, name: string) {
  const { contact } = await upsertContact({ email, name, source: "contact_form" });
  return contact;
}

async function logFor(contactId: string) {
  const db = await getDb();
  return db.select().from(schema.emailLog).where(eq(schema.emailLog.contactId, contactId));
}

async function enrollmentFor(contactId: string, sequenceId: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(schema.sequenceEnrollments)
    .where(and(eq(schema.sequenceEnrollments.contactId, contactId), eq(schema.sequenceEnrollments.sequenceId, sequenceId)));
  return row;
}

beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  await getDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("escapeMarkdown", () => {
  it("neutralises links, autolinks and raw HTML but keeps the visible text", () => {
    for (const evil of [PHISH, "https://evil.example/x", "www.evil.com", "me@evil.com", "<a href=x>hi</a>", "![x](https://e.x/p.png)"]) {
      const html = markdownToEmailHtml(`Hi ${escapeMarkdown(evil)},`);
      expect(html, evil).not.toMatch(/<a |<img /);
    }
    expect(markdownToEmailHtml(escapeMarkdown("J. Smith (Acme)"))).toBe("<p>J. Smith (Acme)</p>\n");
  });
});

describe("automation emails", () => {
  it("never turns a visitor-supplied name into a link", async () => {
    const contact = await contactNamed("victim-1@example.net", PHISH);
    await triggerAutomations("contact_form", contact.id);
    const [log] = await logFor(contact.id);
    expect(log, "auto-reply should be logged").toBeDefined();
    expect(log.subject).not.toContain("[");
    expect(log.subject).not.toContain("https");
    expect(log.html).not.toContain("evil.example");
    expect(log.html).not.toMatch(/<a href="https:\/\/evil/);
  });

  it("restarts a finished contact-form auto-reply when the contact writes again", async () => {
    const contact = await contactNamed("tess-1@example.net", "Tess Tester");
    await triggerAutomations("contact_form", contact.id);
    await triggerAutomations("contact_form", contact.id);
    const logs = await logFor(contact.id);
    expect(logs).toHaveLength(2);
    expect(logs[0].subject).toContain("Tess");
  });

  it("does not interrupt or duplicate an enrollment that is still running", async () => {
    const db = await getDb();
    const [seq] = await db.insert(schema.emailSequences).values({ name: "Two-step booking", trigger: "call_booked" }).returning();
    await db.insert(schema.sequenceSteps).values([
      { sequenceId: seq.id, position: 0, delayHours: 0, subject: "Prep {{firstName}}", body: "Hi {{firstName}}" },
      { sequenceId: seq.id, position: 1, delayHours: 24, subject: "Reminder", body: "See you soon" },
    ]);
    const contact = await contactNamed("booker-1@example.net", "Bo Oker");
    await triggerAutomations("call_booked", contact.id);
    const before = await enrollmentFor(contact.id, seq.id);
    expect(before.nextStep).toBe(1);
    await triggerAutomations("call_booked", contact.id);
    const after = await enrollmentFor(contact.id, seq.id);
    expect(after.nextStep).toBe(1);
    expect(after.status).toBe("active");
    await db.delete(schema.emailSequences).where(eq(schema.emailSequences.id, seq.id));
  });

  it("does not advance or log 'Email sent' when the provider rejects the email, and gives up after repeated failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ message: "Domain not verified" }), { status: 403 })),
    );
    const db = await getDb();
    const [seq] = await db.insert(schema.emailSequences).values({ name: "Manual test", trigger: "manual" }).returning();
    await db.insert(schema.sequenceSteps).values({ sequenceId: seq.id, position: 0, delayHours: 0, subject: "S1", body: "Body" });
    const contact = await contactNamed("bounce-1@example.net", "Bea Bounce");

    await triggerAutomations("manual", contact.id);
    let enrollment = await enrollmentFor(contact.id, seq.id);
    expect(enrollment.status).toBe("active");
    expect(enrollment.nextStep).toBe(0);
    expect(enrollment.nextRunAt!.getTime()).toBeGreaterThan(Date.now() + 30 * 60_000);
    const activities = await db.select().from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    expect(activities.filter((a) => a.type === "email_sent")).toHaveLength(0);

    // Retries until the cap, then stops instead of retrying forever.
    for (let i = 0; i < 3; i++) {
      await db
        .update(schema.sequenceEnrollments)
        .set({ nextRunAt: new Date(Date.now() - 1000) })
        .where(eq(schema.sequenceEnrollments.id, enrollment.id));
      expect(await processEnrollment(enrollment.id)).toBe("failed");
    }
    enrollment = await enrollmentFor(contact.id, seq.id);
    expect(enrollment.status).toBe("stopped");
    expect(enrollment.nextRunAt).toBeNull();
    expect((await logFor(contact.id)).map((l) => l.status)).toEqual(["failed", "failed", "failed", "failed"]);
    await db.delete(schema.emailSequences).where(eq(schema.emailSequences.id, seq.id));
  });
});

describe("one-click unsubscribe", () => {
  it("sends RFC 8058 headers pointing at the one-click endpoint", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    const requests: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (...args: [string, RequestInit]) => {
        requests.push(args[1]);
        return new Response(JSON.stringify({ id: "em_1" }), { status: 200 });
      }),
    );
    await sendEmail({ to: "list@example.net", subject: "News", markdown: "Hi", kind: "sequence", unsubscribeToken: "abcdef0123456789abcdef" });
    const body = JSON.parse(String(requests[0].body)) as { headers: Record<string, string>; html: string };
    expect(body.headers["List-Unsubscribe"]).toMatch(/^<https?:\/\/[^>]+\/api\/unsubscribe\/abcdef0123456789abcdef>$/);
    expect(body.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    expect(body.html).toContain("/unsubscribe/abcdef0123456789abcdef");
  });

  it("unsubscribes once, stops automations and ignores unknown or malformed tokens", async () => {
    const db = await getDb();
    const contact = await contactNamed("leaver-1@example.net", "Lee Ver");
    await triggerAutomations("lead_magnet", contact.id);
    expect(await setMarketingSubscription("not a token!", false, "one_click")).toBeNull();
    expect(await setMarketingSubscription("0".repeat(32), false, "one_click")).toBeNull();
    expect(await setMarketingSubscription(contact.unsubscribeToken, false, "one_click")).toEqual({ contactId: contact.id, changed: true });
    expect(await setMarketingSubscription(contact.unsubscribeToken, false, "one_click")).toEqual({ contactId: contact.id, changed: false });
    const [fresh] = await db.select().from(schema.contacts).where(eq(schema.contacts.id, contact.id));
    expect(fresh.unsubscribed).toBe(true);
    const active = await db
      .select()
      .from(schema.sequenceEnrollments)
      .where(and(eq(schema.sequenceEnrollments.contactId, contact.id), eq(schema.sequenceEnrollments.status, "active")));
    expect(active).toHaveLength(0);
    const notes = await db.select().from(schema.activities).where(eq(schema.activities.contactId, contact.id));
    expect(notes.filter((a) => a.title === "Unsubscribed from marketing emails")).toHaveLength(1);
  });
});
