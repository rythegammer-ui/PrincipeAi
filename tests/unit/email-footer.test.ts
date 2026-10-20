import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  assertAdmin: async () => ({ sub: "admin", role: "admin", email: "admin@example.com" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { updateSettingsAction } from "@/app/admin/(panel)/settings/actions";
import { mailingAddressStatus } from "@/app/admin/(panel)/settings/integration-status";
import { extractEmailBody } from "@/components/funnels/automation-utils";
import { IntegrationsChecklist } from "@/components/funnels/integrations-checklist";
import { getDb } from "@/db";
import { emailLayout, emailMailingAddress, markdownToEmailHtml, sendEmail } from "@/lib/email";
import { DEFAULT_SETTINGS, getSettings, updateSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/utils";

const ADDRESS = "Principe AI LLC\nPO Box 1234\nAustin, TX 78701";
const ADDRESS_HTML = "Principe AI LLC<br>PO Box 1234<br>Austin, TX 78701";
const UNSUBSCRIBE = "https://example.com/unsubscribe/abc";

/** The footer cell of a rendered email (everything after the body). */
function footerOf(html: string): string {
  const start = html.indexOf("border-top:1px solid #eeeef3");
  expect(start, "footer should be present").toBeGreaterThan(0);
  return html.slice(start, html.indexOf("</td></tr>", start));
}

/** Captures the emails handed to Resend. */
function captureResend(): { subject: string; html: string }[] {
  vi.stubEnv("RESEND_API_KEY", "re_test");
  const sent: { subject: string; html: string }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ id: "em_x" }), { status: 200 });
    }),
  );
  return sent;
}

beforeAll(async () => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  await getDb();
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await updateSettings({ mailingAddress: DEFAULT_SETTINGS.mailingAddress });
});

describe("email footer layout", () => {
  it("shows the postal address, one line per line, just above the unsubscribe link", () => {
    const footer = footerOf(emailLayout("<p>Hi</p>", { unsubscribeUrl: UNSUBSCRIBE, mailingAddress: ADDRESS }));
    expect(footer).toContain(`<br>${ADDRESS_HTML}\n<br><a href="${UNSUBSCRIBE}" style="color:#8a8fa3;">Unsubscribe</a> from these emails.`);
    // Same footer styling: the address line is the only addition (plain text in the cell's grey 12px style).
    expect(footer.replace(`<br>${ADDRESS_HTML}\n`, "")).toBe(footerOf(emailLayout("<p>Hi</p>", { unsubscribeUrl: UNSUBSCRIBE })));
  });

  it("escapes the address, accepts Windows line breaks and drops blank lines", () => {
    const footer = footerOf(emailLayout("", { mailingAddress: '  <b>Acme & "Co"</b>  \r\n\r\n  PMB 42, 100 Main St \r\nSpringfield, IL 62701\n' }));
    expect(footer).toContain("<br>&lt;b&gt;Acme &amp; &quot;Co&quot;&lt;/b&gt;<br>PMB 42, 100 Main St<br>Springfield, IL 62701\n");
    expect(footer).not.toContain("<b>");
    expect(footer).not.toContain("<br><br>");
  });

  it("leaves the footer exactly as before without an address", () => {
    for (const opts of [{}, { unsubscribeUrl: UNSUBSCRIBE }]) {
      const without = emailLayout("<p>Hi</p>", opts);
      expect(emailLayout("<p>Hi</p>", { ...opts, mailingAddress: "" })).toBe(without);
      expect(emailLayout("<p>Hi</p>", { ...opts, mailingAddress: " \n \n" })).toBe(without);
    }
    expect(footerOf(emailLayout("<p>Hi</p>", {}))).not.toContain("<br>");
  });

  it("keeps the address out of the body, so resending a logged email doesn't repeat it", () => {
    const html = emailLayout("<p>Hello there</p>", { unsubscribeUrl: UNSUBSCRIBE, mailingAddress: ADDRESS });
    expect(extractEmailBody(html)).toBe("<p>Hello there</p>");
  });
});

describe("sendEmail footer by kind", () => {
  it("adds the owner's address to marketing emails (automation sequences and broadcasts)", async () => {
    await updateSettings({ mailingAddress: ADDRESS });
    expect(await emailMailingAddress()).toBe(ADDRESS);
    const sent = captureResend();
    for (const kind of ["sequence", "broadcast"]) {
      const result = await sendEmail({ to: `${kind}@example.net`, subject: kind, markdown: "News", kind, unsubscribeToken: "abcdef0123456789abcdef" });
      expect(result.status).toBe("sent");
    }
    expect(sent).toHaveLength(2);
    for (const email of sent) {
      const footer = footerOf(email.html);
      expect(footer, email.subject).toContain(ADDRESS_HTML);
      expect(footer, email.subject).toContain("/unsubscribe/abcdef0123456789abcdef");
      expect(email.html.split("PO Box 1234")).toHaveLength(2);
    }
  });

  it("picks up a changed address on the next send", async () => {
    const sent = captureResend();
    await updateSettings({ mailingAddress: ADDRESS });
    await sendEmail({ to: "a@example.net", subject: "First", markdown: "Hi", kind: "sequence" });
    await updateSettings({ mailingAddress: "PO Box 99\nDenver, CO 80202" });
    await sendEmail({ to: "a@example.net", subject: "Second", markdown: "Hi", kind: "sequence" });
    expect(footerOf(sent[0].html)).toContain(ADDRESS_HTML);
    expect(footerOf(sent[1].html)).toContain("<br>PO Box 99<br>Denver, CO 80202");
    expect(sent[1].html).not.toContain("PO Box 1234");
  });

  it("leaves transactional emails unchanged", async () => {
    await updateSettings({ mailingAddress: ADDRESS });
    const sent = captureResend();
    const kinds = ["receipt", "booking_confirmation", "magic_link", "guide_link", "notification", "manual", "test"];
    for (const kind of kinds) {
      await sendEmail({ to: "buyer@example.net", subject: kind, markdown: "Thanks for your order", kind, preheader: "Receipt", unsubscribeToken: "abcdef0123456789abcdef" });
    }
    const expected = emailLayout(markdownToEmailHtml("Thanks for your order"), { preheader: "Receipt" });
    expect(sent.map((e) => e.subject)).toEqual(kinds);
    for (const email of sent) {
      expect(email.html, email.subject).toBe(expected);
      expect(email.html, email.subject).not.toContain("PO Box");
    }
  });

  it("still sends marketing emails while the address is empty, without an address line", async () => {
    const sent = captureResend();
    expect(await emailMailingAddress()).toBe("");
    const result = await sendEmail({ to: "lead@example.net", subject: "Welcome", markdown: "Hi", kind: "sequence", unsubscribeToken: "abcdef0123456789abcdef" });
    expect(result.status).toBe("sent");
    expect(sent[0].html).toBe(emailLayout(markdownToEmailHtml("Hi"), { unsubscribeUrl: absoluteUrl("/unsubscribe/abcdef0123456789abcdef") }));
  });
});

describe("Settings → mailing address", () => {
  function settingsForm(mailingAddress: string): FormData {
    const fd = new FormData();
    for (const [key, value] of Object.entries({ ...DEFAULT_SETTINGS, mailingAddress })) {
      if (typeof value === "boolean") {
        if (value) fd.set(key, "on");
      } else fd.set(key, String(value));
    }
    return fd;
  }

  it("defaults to empty", async () => {
    expect(DEFAULT_SETTINGS.mailingAddress).toBe("");
    expect((await getSettings()).mailingAddress).toBe("");
  });

  it("saves a tidy multi-line address", async () => {
    const state = await updateSettingsAction({}, settingsForm("  Principe AI LLC \r\n\r\nPO Box   1234\r\n Austin, TX 78701  \r\n"));
    expect(state).toMatchObject({ ok: true });
    expect((await getSettings()).mailingAddress).toBe(ADDRESS);

    expect(await updateSettingsAction({}, settingsForm(""))).toMatchObject({ ok: true });
    expect((await getSettings()).mailingAddress).toBe("");
  });

  it("rejects an address that is too long or has too many lines", async () => {
    await updateSettings({ mailingAddress: ADDRESS });
    const tooLong = await updateSettingsAction({}, settingsForm(`PO Box 1\n${"x".repeat(300)}`));
    expect(tooLong.fieldErrors?.mailingAddress).toMatch(/300 characters/);
    const tooManyLines = await updateSettingsAction({}, settingsForm("1\n2\n3\n4\n5\n6\n7"));
    expect(tooManyLines.fieldErrors?.mailingAddress).toMatch(/6 lines/);
    expect((await getSettings()).mailingAddress).toBe(ADDRESS);
  });

  it("is flagged in the integrations checklist until it is set", () => {
    expect(mailingAddressStatus("")).toEqual({ status: "attention", statusLabel: "Missing — required by law" });
    expect(mailingAddressStatus("  \n ")).toMatchObject({ status: "attention" });
    expect(mailingAddressStatus(ADDRESS)).toEqual({ status: "ready", statusLabel: "Set" });

    const item = { id: "mailing-address", title: "Mailing address (marketing emails)", envVars: [], summary: "", steps: [] };
    const html = renderToStaticMarkup(createElement(IntegrationsChecklist, { items: [{ ...item, ...mailingAddressStatus("") }] }));
    expect(html).toMatch(/<details[^>]*open=""[^>]*>.*Missing — required by law/);
    expect(renderToStaticMarkup(createElement(IntegrationsChecklist, { items: [{ ...item, ...mailingAddressStatus(ADDRESS) }] }))).not.toContain("open=");
  });
});
