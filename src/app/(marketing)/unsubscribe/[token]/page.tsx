import { eq } from "drizzle-orm";
import { CheckCircle2, LinkIcon, MailX } from "lucide-react";
import type { Metadata } from "next";
import { maskEmail } from "@/components/funnels/automation-utils";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/config/site";
import { getDb, schema } from "@/db";
import { SubscriptionForm } from "./subscription-form";

export const metadata: Metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
  // The token in this URL is a credential: never leak it to other sites.
  referrer: "no-referrer",
};

const TOKEN = /^[A-Za-z0-9_-]{16,128}$/;

async function findContact(token: string) {
  if (!TOKEN.test(token)) return null;
  const db = await getDb();
  const [contact] = await db
    .select({ email: schema.contacts.email, unsubscribed: schema.contacts.unsubscribed })
    .from(schema.contacts)
    .where(eq(schema.contacts.unsubscribeToken, token))
    .limit(1);
  return contact ?? null;
}

export default async function UnsubscribePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contact = await findContact(token);

  return (
    <section className="bg-zinc-50 py-16 sm:py-24">
      <div className="container-narrow">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-6 text-center shadow-soft sm:p-10">
          {!contact ? (
            <>
              <IconBadge tone="neutral">
                <LinkIcon className="size-5" aria-hidden />
              </IconBadge>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">This link isn&apos;t working</h1>
              <p className="mt-3 text-zinc-600">
                It may be incomplete or out of date. Use the unsubscribe link at the bottom of our most recent email, or reply to that email and we&apos;ll remove
                you by hand.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href="/" variant="outline">
                  Go to the homepage
                </ButtonLink>
                <a href={`mailto:${site.contactEmail}?subject=Unsubscribe`} className="inline-flex min-h-10 items-center justify-center text-sm font-medium text-brand-700 hover:underline">
                  Email us instead
                </a>
              </div>
            </>
          ) : contact.unsubscribed ? (
            <>
              <IconBadge tone="green">
                <CheckCircle2 className="size-5" aria-hidden />
              </IconBadge>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                You&apos;re <span className="font-display text-3xl font-normal italic sm:text-4xl">unsubscribed</span>
              </h1>
              <p className="mt-3 text-zinc-600">
                <span className="font-medium text-zinc-900">{maskEmail(contact.email)}</span> won&apos;t receive our newsletters or automated emails any more.
                You&apos;ll still get the essentials: receipts, booking confirmations and login links.
              </p>
              <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50/70 p-5">
                <p className="text-sm font-medium text-zinc-900">Unsubscribed by mistake?</p>
                <p className="mt-1 mb-4 text-sm text-zinc-500">You can rejoin with one click.</p>
                <SubscriptionForm token={token} intent="resubscribe" />
              </div>
              <ButtonLink href="/" variant="ghost" className="mt-6">
                Back to {site.name}
              </ButtonLink>
            </>
          ) : (
            <>
              <IconBadge tone="brand">
                <MailX className="size-5" aria-hidden />
              </IconBadge>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Unsubscribe from {site.name} emails?</h1>
              <p className="mt-3 text-zinc-600">
                We&apos;ll stop sending tips, guides and automated emails to <span className="font-medium text-zinc-900">{maskEmail(contact.email)}</span>.
                You&apos;ll still receive the essentials, like receipts, booking confirmations and login links.
              </p>
              <div className="mt-8">
                <SubscriptionForm token={token} intent="unsubscribe" />
              </div>
              <p className="mt-4 text-sm text-zinc-500">Changed your mind? Just close this page. Nothing changes until you click the button.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function IconBadge({ tone, children }: { tone: "brand" | "green" | "neutral"; children: React.ReactNode }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 ring-brand-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    neutral: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };
  return <span className={`mx-auto inline-flex size-12 items-center justify-center rounded-2xl ring-1 ${tones[tone]}`}>{children}</span>;
}
