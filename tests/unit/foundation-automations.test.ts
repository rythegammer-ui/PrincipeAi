import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { site } from "@/config/site";
import { bookingEmailMarkdown, type BookingDetails } from "@/lib/booking-service";
import { processEnrollment, recipientTemplateVars, triggerAutomations } from "@/lib/automations";
import { captureLead, setMarketingSubscription, upsertContact } from "@/lib/crm";
import { emailBusinessName, escapeMarkdown, markdownToEmailHtml, notifyOwner, sendEmail } from "@/lib/email";
import { DEFAULT_SETTINGS, updateSettings } from "@/lib/settings";

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

/** Captures the JSON bodies sent to Resend. */
function captureResend(): { subject: string; reply_to: string; html: string }[] {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  const sent: { subject: string; reply_to: string; html: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ id: "em_x" }), { status: 200 });
    }),
  );
  return sent;
}

describe("business name (Admin → Settings)", () => {
  afterEach(async () => {
    await updateSettings({ businessName: DEFAULT_SETTINGS.businessName });
  });

  it("signs automation emails, the editor preview vars and booking emails", async () => {
    await updateSettings({ businessName: "Principe Academy" });
    expect(await emailBusinessName()).toBe("Principe Academy");

    const contact = await contactNamed("renamed-brand-1@example.net", "Nina Name");
    await triggerAutomations("lead_magnet", contact.id);
    const [log] = await logFor(contact.id);
    expect(log, "the opt-in email should be logged").toBeDefined();
    expect(log.html).toContain("The Principe Academy team");
    expect(log.html).not.toContain(`The ${site.name} team`);

    const details = {
      booking: {
        id: "b1",
        status: "cancelled",
        startAt: new Date("2030-01-07T15:00:00Z"),
        endAt: new Date("2030-01-07T15:30:00Z"),
        timezone: "UTC",
        manageToken: "0".repeat(32),
        meetingUrl: null,
      },
      meetingType: { name: "Strategy call", slug: "strategy-call", locationLabel: "Video call", locationUrl: null, durationMin: 30, priceCents: 0, active: true },
      contact: { id: contact.id, name: "Nina Name", email: contact.email },
    } as unknown as BookingDetails;
    const { markdown } = bookingEmailMarkdown("cancelled", details, { businessName: "Principe Academy" });
    expect(markdown).toContain("The Principe Academy team");
    expect(bookingEmailMarkdown("cancelled", details).markdown).toContain(`The ${site.name} team`);
  });

  it("keeps an owner-typed name from adding links or formatting to email bodies", () => {
    const vars = recipientTemplateVars({ name: "Alex Rivera", email: "alex@example.com" }, "Acme [Login](https://evil.example)");
    expect(vars.subject.businessName).toBe("Acme [Login](https://evil.example)");
    expect(markdownToEmailHtml(`The ${vars.body.businessName} team`)).not.toContain("<a ");
    expect(vars.subject.firstName).toBe("Alex");
  });
});

describe("owner notifications", () => {
  it("reply to the lead, not to the owner", async () => {
    const sent = captureResend();
    await notifyOwner("No reply-to", "Body");
    await notifyOwner("With reply-to", "Body", { replyTo: "cora.contact@example.com" });
    expect(sent.find((m) => m.subject.endsWith("No reply-to"))?.reply_to).toBe(site.contactEmail);
    expect(sent.find((m) => m.subject.endsWith("With reply-to"))?.reply_to).toBe("cora.contact@example.com");

    await captureLead({
      email: "Cora.Lead@Example.com",
      name: "Cora Lead",
      source: "contact_form",
      activity: { type: "form", title: "Sent a message" },
      notify: { kind: "lead", subject: "New message from Cora Lead", markdown: "Hello" },
    });
    expect(sent.find((m) => m.subject.endsWith("New message from Cora Lead"))?.reply_to).toBe("cora.lead@example.com");
  });
});
