import "server-only";
import { Marked } from "marked";
import { getDb, schema } from "@/db";
import type { EmailStatus } from "@/db/schema";
import { site } from "@/config/site";
import { absoluteUrl } from "@/lib/utils";

/** Kinds that are marketing (respect unsubscribe + include unsubscribe link). */
const MARKETING_KINDS = new Set(["sequence", "broadcast", "nurture"]);

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Markdown renderer that escapes any raw HTML (safe for AI-generated or user-provided text). */
const safeMarked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
  },
});

export function markdownToEmailHtml(markdown: string): string {
  return safeMarked.parse(markdown, { async: false }) as string;
}

/** Escapes visitor-supplied text for emailed Markdown (defined in lib/utils.ts so client code can use it too). */
export { escapeMarkdown } from "@/lib/utils";

export type TemplateVars = Record<string, string | number | null | undefined>;

/** Replaces {{placeholders}}. Unknown placeholders are removed. Values are HTML-escaped when `escape` is true. */
export function fillTemplate(template: string, vars: TemplateVars, escape = false): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const v = vars[key];
    if (v === undefined || v === null) return "";
    return escape ? escapeHtml(String(v)) : String(v);
  });
}

/** Standard links available to every template. */
export function defaultTemplateVars(): TemplateVars {
  return {
    siteUrl: absoluteUrl("/"),
    bookUrl: absoluteUrl("/book"),
    coursesUrl: absoluteUrl("/courses"),
    assessmentUrl: absoluteUrl("/assessment"),
    guideUrl: absoluteUrl("/guide?src=email"),
    loginUrl: absoluteUrl("/login"),
    businessName: site.name,
  };
}

/** Wraps body HTML in the branded email layout. */
export function emailLayout(bodyHtml: string, opts: { preheader?: string; unsubscribeUrl?: string } = {}): string {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(site.name)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2330;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e7e7ee;">
<tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:22px 32px;">
<a href="${absoluteUrl("/")}" style="color:#ffffff;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:-0.01em;">✦ ${escapeHtml(site.name)}</a>
</td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.65;" class="content">
${bodyHtml}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #eeeef3;font-size:12px;line-height:1.6;color:#8a8fa3;">
© ${year} ${escapeHtml(site.company)} · <a href="${absoluteUrl("/")}" style="color:#8a8fa3;">${escapeHtml(site.name)}</a>
${opts.unsubscribeUrl ? `<br><a href="${opts.unsubscribeUrl}" style="color:#8a8fa3;">Unsubscribe</a> from these emails.` : ""}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const SIGN_IN_TOKEN = /(\/auth\/verify\?token=)[^"'&\s<>)]+/g;
const REDACTED_TOKEN = "[redacted]";

/**
 * Login tokens are stored hashed, so a read-only copy of the database must not hold usable sign-in
 * links either: the Email Log keeps magic-link emails with the token removed.
 */
export function redactSignInLinks(html: string): string {
  return html.replace(SIGN_IN_TOKEN, `$1${REDACTED_TOKEN}`);
}

/** True for a logged email whose sign-in link was redacted (it can't be re-sent as is). */
export function hasRedactedSignInLink(html: string): boolean {
  return html.includes(`/auth/verify?token=${REDACTED_TOKEN}`);
}

export type SendEmailInput = {
  to: string;
  subject: string;
  /** Markdown body (preferred) — rendered safely + wrapped in the layout. */
  markdown?: string;
  /** Raw inner HTML (trusted, system-authored only). Ignored when markdown is set. */
  html?: string;
  /** e.g. "welcome" | "booking_confirmation" | "booking_reminder" | "sequence" | "magic_link" | "receipt" | "notification" | "manual" */
  kind: string;
  contactId?: string | null;
  preheader?: string;
  replyTo?: string;
  /** Contact's unsubscribe token — adds an unsubscribe link (required for marketing kinds). */
  unsubscribeToken?: string | null;
  /** Skip sending when the contact unsubscribed (marketing kinds). */
  unsubscribed?: boolean;
  attachments?: { filename: string; content: string /* base64 */; contentType?: string }[];
};

/**
 * Sends an email through Resend when RESEND_API_KEY is set; otherwise records it as
 * "simulated" so the whole flow can be tested locally. Every email is logged to email_log (with any
 * one-time sign-in token redacted).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ status: EmailStatus; id?: string }> {
  const isMarketing = MARKETING_KINDS.has(input.kind);
  const token = input.unsubscribeToken && isMarketing ? encodeURIComponent(input.unsubscribeToken) : undefined;
  // Footer link → confirmation page. Header → RFC 8058 one-click endpoint (Gmail/Yahoo "Unsubscribe" button).
  const unsubscribeUrl = token ? absoluteUrl(`/unsubscribe/${token}`) : undefined;
  const oneClickUrl = token ? absoluteUrl(`/api/unsubscribe/${token}`) : undefined;
  const inner = input.markdown !== undefined ? markdownToEmailHtml(input.markdown) : (input.html ?? "");
  const html = emailLayout(inner, { preheader: input.preheader, unsubscribeUrl });

  let status: EmailStatus = "simulated";
  let providerId: string | undefined;
  let error: string | undefined;

  if (isMarketing && input.unsubscribed) {
    status = "skipped";
  } else if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: site.emailFrom,
          to: [input.to],
          subject: input.subject,
          html,
          reply_to: input.replyTo ?? site.contactEmail,
          headers: oneClickUrl
            ? { "List-Unsubscribe": `<${oneClickUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
            : undefined,
          attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, content_type: a.contentType })),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (res.ok) {
        status = "sent";
        providerId = body.id;
      } else {
        status = "failed";
        error = body.message ?? `HTTP ${res.status}`;
      }
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.log(`[email:simulated] to=${input.to} subject="${input.subject}" kind=${input.kind}`);
  }

  try {
    const db = await getDb();
    await db.insert(schema.emailLog).values({
      contactId: input.contactId ?? null,
      to: input.to,
      subject: input.subject,
      html: redactSignInLinks(html),
      kind: input.kind,
      status,
      providerId: providerId ?? null,
      error: error ?? null,
    });
  } catch (err) {
    console.error("[email] failed to log email", err);
  }
  if (status === "failed") console.error(`[email] send failed to=${input.to}: ${error}`);
  return { status, id: providerId };
}

/** Internal notification to the business owner (new lead, booking, purchase…). */
export async function notifyOwner(subject: string, markdown: string): Promise<void> {
  const { getSettings } = await import("@/lib/settings");
  const s = await getSettings();
  if (!s.notifyEmail) return;
  await sendEmail({ to: s.notifyEmail, subject: `[${site.name}] ${subject}`, markdown, kind: "notification" });
}
