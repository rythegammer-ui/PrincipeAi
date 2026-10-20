import type { Metadata } from "next";
import { Code, ExtLink, IntegrationsChecklist, type IntegrationItem } from "@/components/funnels/integrations-checklist";
import { SettingsForm } from "@/components/funnels/settings-form";
import { SettingsTools } from "@/components/funnels/settings-tools";
import { PageHeader } from "@/components/ui/misc";
import { site } from "@/config/site";
import { getDb } from "@/db";
import { AI_MODEL } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { integrations } from "@/lib/integrations";
import { readWebhookSecret } from "@/lib/payment-links";
import { checkoutMode, livePaymentsBlocked } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { stripeTestMode } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { emailStatus, isLiveDeployment, paymentsStatus } from "./integration-status";
import { groupTimezones, supportedTimezones } from "./timezones";

export const metadata: Metadata = { title: "Settings" };

const VERCEL_ENV = "Vercel → your project → Settings → Environment Variables";

/** `autoWebhook`: the payment-link sync created the Stripe webhook endpoint itself (no STRIPE_WEBHOOK_SECRET needed). */
function integrationItems(live: boolean, autoWebhook: boolean): IntegrationItem[] {
  const s = integrations();
  // In production /api/cron refuses every call without CRON_SECRET (see authorizeCron).
  const cronRequired = !s.cron && process.env.NODE_ENV === "production";
  const email = emailStatus({ email: s.email, live });
  const payments = paymentsStatus({ stripe: s.stripe, stripeWebhook: s.stripeWebhook || autoWebhook, mode: checkoutMode(), liveKeyBlocked: livePaymentsBlocked() });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const webhookUrl = absoluteUrl("/api/stripe/webhook");
  const redeploy = (
    <>
      Redeploy (Vercel → Deployments → ⋯ → <strong>Redeploy</strong>) so the new value takes effect.
    </>
  );

  return [
    {
      id: "database",
      title: "Database",
      envVars: ["DATABASE_URL"],
      status: s.database === "postgres" ? "ready" : "attention",
      statusLabel: s.database === "postgres" ? "Connected" : s.database === "pglite-file" ? "Local database" : "Demo mode",
      summary:
        s.database === "postgres"
          ? "Your contacts, bookings, orders and courses are stored in Postgres."
          : s.database === "pglite-file"
            ? "You're using the built-in local database (saved in .data/pglite). Perfect for development; connect Postgres before going live."
            : "No database is connected, so the site runs on a temporary in-memory database that resets. Connect Postgres before sharing your site.",
      steps: [
        <>In Vercel, open your project and go to <strong>Storage</strong> (or the <strong>Marketplace</strong>).</>,
        <>Create a <strong>Neon</strong> or <strong>Supabase</strong> Postgres database and connect it to this project for Production, Preview and Development.</>,
        <>Vercel adds <Code>DATABASE_URL</Code> (or <Code>POSTGRES_URL</Code>) for you. Nothing to copy.</>,
        <>Redeploy. Database migrations run automatically during the build, and your courses, meeting types and email automations are set up on the first deploy.</>,
      ],
    },
    {
      id: "auth",
      title: "Login security",
      envVars: ["AUTH_SECRET"],
      status: s.authSecret ? "ready" : "attention",
      statusLabel: s.authSecret ? "Set" : "Using a development key",
      summary: "A long random secret (at least 16 characters) that signs admin and student logins. Required in production for the admin login.",
      steps: [
        <>Generate a secret in a terminal: <Code>openssl rand -base64 32</Code> (or use any password manager&apos;s 32+ character generator).</>,
        <>Add it in {VERCEL_ENV} as <Code>AUTH_SECRET</Code>.</>,
        redeploy,
        <>Changing it later signs everyone out, which is a quick way to end all sessions.</>,
      ],
    },
    {
      id: "admin",
      title: "Admin login",
      envVars: ["ADMIN_EMAIL", "ADMIN_PASSWORD"],
      status: s.adminConfigured ? "ready" : "attention",
      statusLabel: s.adminConfigured ? "Set" : "Using the demo login",
      summary: "The email and password for this dashboard.",
      steps: [
        <>In {VERCEL_ENV}, add <Code>ADMIN_EMAIL</Code> (your email) and <Code>ADMIN_PASSWORD</Code> (a long, unique password of at least 12 characters). <Code>AUTH_SECRET</Code> above must be set too.</>,
        redeploy,
        <>Sign in at <Code>/admin/login</Code> with the new details. The demo login stops working.</>,
        <>Changing <Code>ADMIN_PASSWORD</Code> later signs out every admin session. To do that without a new password, set <Code>ADMIN_SESSION_VERSION</Code> to a new value (e.g. <Code>2</Code>) and redeploy.</>,
      ],
    },
    {
      id: "site-url",
      title: "Site address",
      envVars: ["NEXT_PUBLIC_SITE_URL"],
      status: siteUrl ? "ready" : "attention",
      statusLabel: siteUrl ? "Set" : "Auto-detected",
      summary: (
        <>
          Used in emails, payment redirects and calendar invites. Links currently point to <Code>{absoluteUrl("/")}</Code>.
        </>
      ),
      steps: [
        <>Connect your domain in Vercel → your project → Settings → <strong>Domains</strong>.</>,
        <>In {VERCEL_ENV}, add <Code>NEXT_PUBLIC_SITE_URL</Code> with your full address, e.g. <Code>https://yourdomain.com</Code> (no trailing slash).</>,
        redeploy,
      ],
    },
    {
      id: "email",
      title: "Email delivery (Resend)",
      envVars: ["RESEND_API_KEY", "EMAIL_FROM", "CONTACT_EMAIL"],
      ...email,
      summary: (
        <>
          Delivers automations, confirmations, receipts and login links. Without it, emails are recorded in the Email Log only.
          {live && !s.email && (
            <>
              {" "}
              <strong>On a live site that means students can&apos;t sign in</strong> (their sign-in links never arrive, even after they pay), and receipts,
              booking confirmations and your own notifications aren&apos;t delivered.
            </>
          )}{" "}
          Sending from <Code>{site.emailFrom}</Code>; customers&apos; replies go to <Code>{site.contactEmail}</Code>.
        </>
      ),
      steps: [
        <>Create a free account at <ExtLink href="https://resend.com">resend.com</ExtLink>.</>,
        <>Go to <strong>Domains</strong>, add your domain and create the DNS records it shows you (at your domain registrar). Wait until it says <strong>Verified</strong>.</>,
        <>Go to <strong>API Keys</strong> and create a key with sending access.</>,
        <>In {VERCEL_ENV}, add <Code>RESEND_API_KEY</Code> and <Code>EMAIL_FROM</Code>, e.g. <Code>{`${site.name} <hello@yourdomain.com>`}</Code>, using your verified domain.</>,
        <>
          Optional: set <Code>CONTACT_EMAIL</Code> to the inbox that should get customers&apos; replies. It is also the public contact address on the contact,
          booking, terms and privacy pages, the footer and calendar invites.
        </>,
        redeploy,
        <>Come back here and use <strong>Send a test email</strong> below.</>,
      ],
    },
    {
      id: "ai",
      title: "AI (Claude)",
      envVars: ["ANTHROPIC_API_KEY", "ANTHROPIC_MODEL"],
      status: s.ai ? "ready" : "optional",
      statusLabel: s.ai ? "Connected" : "Built-in fallback",
      summary: (
        <>
          Powers the website assistant, the course tutor, personalised assessment plans and email drafting. Model in use: <Code>{AI_MODEL}</Code>. Without a
          key, every feature falls back to helpful built-in text.
        </>
      ),
      steps: [
        <>Sign in at <ExtLink href="https://console.anthropic.com">console.anthropic.com</ExtLink>, add billing, then open <strong>API Keys</strong> and create a key.</>,
        <>In {VERCEL_ENV}, add it as <Code>ANTHROPIC_API_KEY</Code>.</>,
        <>Optional: set <Code>ANTHROPIC_MODEL</Code> to choose a model, e.g. <Code>claude-sonnet-5-5</Code> or <Code>claude-haiku-5-5</Code> for lower cost. Leave it empty to use <Code>claude-opus-5-5</Code>.</>,
        redeploy,
      ],
    },
    {
      id: "stripe",
      title: "Payments (Stripe)",
      envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      ...payments,
      steps: [
        <>In the <ExtLink href="https://dashboard.stripe.com/apikeys">Stripe dashboard</ExtLink>, open <strong>Developers → API keys</strong> and copy the <strong>Secret key</strong>. Start with test mode (<Code>sk_test_…</Code>).</>,
        <>Add it in {VERCEL_ENV} as <Code>STRIPE_SECRET_KEY</Code>.</>,
        <>
          Redeploy. The site then creates each course&apos;s payment link and its own Stripe webhook (Admin → Courses → <strong>Sync with Stripe</strong> does
          the same any time). To use a webhook of your own instead, follow the next steps.
        </>,
        <>Open <strong>Developers → Webhooks → Add endpoint</strong> and use this URL: <Code>{webhookUrl}</Code></>,
        <>
          Select these events: <Code>checkout.session.completed</Code>, <Code>checkout.session.async_payment_succeeded</Code>,{" "}
          <Code>checkout.session.async_payment_failed</Code>, <Code>checkout.session.expired</Code>, <Code>charge.refunded</Code>,{" "}
          <Code>charge.dispute.created</Code> and <Code>charge.dispute.closed</Code>.
        </>,
        <>Copy the endpoint&apos;s <strong>Signing secret</strong> (<Code>whsec_…</Code>) and add it as <Code>STRIPE_WEBHOOK_SECRET</Code>.</>,
        <>{redeploy} When you&apos;re ready to take real payments, repeat with your live-mode key and a live webhook.</>,
      ],
    },
    {
      id: "cron",
      title: "Scheduled jobs (Vercel Cron)",
      envVars: ["CRON_SECRET"],
      status: s.cron ? "ready" : "attention",
      statusLabel: s.cron ? "Secured" : cronRequired ? "Not running — required" : "Not secured",
      summary: (
        <>
          A background job at <Code>/api/cron</Code> sends due automation emails and booking reminders, releases unpaid booking holds and cleans up old data.
          Vercel runs it once a day on the Hobby plan (14:00 UTC by default).
          {cronRequired && (
            <>
              {" "}
              <strong>Without <Code>CRON_SECRET</Code>, Vercel Cron calls are rejected</strong>, so scheduled automation emails and booking reminders are
              paused until you set it. <strong>Run automations now</strong> below still works by hand.
            </>
          )}
        </>
      ),
      steps: [
        <>Generate a secret: <Code>openssl rand -base64 32</Code>.</>,
        <>Add it in {VERCEL_ENV} as <Code>CRON_SECRET</Code>. Vercel sends it automatically with every scheduled run, so nobody else can trigger the job.</>,
        redeploy,
        <>
          On a Pro plan, run it hourly so emails go out closer to their scheduled time: in <Code>vercel.json</Code>, change the schedule to{" "}
          <Code>0 * * * *</Code>, add <Code>CRON_INTERVAL_HOURS</Code> = <Code>1</Code> in {VERCEL_ENV} (so booking reminders keep their timing), and redeploy.
        </>,
        <>You can always run it by hand with <strong>Run automations now</strong> below.</>,
      ],
    },
  ];
}

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  const autoWebhook = Boolean(await readWebhookSecret(await getDb(), stripeTestMode() ? "test" : "live").catch(() => null));
  const timezones = groupTimezones(supportedTimezones());
  const live = isLiveDeployment(process.env.NODE_ENV, integrations().demoMode);

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="general-heading">
        <PageHeader title="Settings" description="Your business details, notifications, AI assistant and site-wide options." />
        <h2 id="general-heading" className="sr-only">
          General settings
        </h2>
        <SettingsForm settings={settings} timezones={timezones} />
      </section>

      <section aria-labelledby="integrations" className="flex flex-col gap-4">
        <div>
          <h2 id="integrations" className="scroll-mt-20 text-xl font-semibold tracking-tight text-zinc-900">
            Integrations
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Connect these in Vercel to take the platform live. Each one takes a few minutes.</p>
        </div>
        <IntegrationsChecklist items={integrationItems(live, autoWebhook)} live={live} />
      </section>

      <section aria-labelledby="tools-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="tools-heading" className="text-xl font-semibold tracking-tight text-zinc-900">
            Tools
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Check that email works, or run the scheduled jobs without waiting for the next run.</p>
        </div>
        <SettingsTools notifyEmail={settings.notifyEmail} />
      </section>
    </div>
  );
}
