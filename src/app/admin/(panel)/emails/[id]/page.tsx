import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { EMAIL_STATUS_META, humanizeKind } from "@/components/funnels/automation-utils";
import { ResendButton } from "@/components/funnels/resend-button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getDb, schema } from "@/db";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatDateTime } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

async function loadEmail(id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const db = await getDb();
  const [row] = await db
    .select({ email: schema.emailLog, contactName: schema.contacts.name })
    .from(schema.emailLog)
    .leftJoin(schema.contacts, eq(schema.contacts.id, schema.emailLog.contactId))
    .where(eq(schema.emailLog.id, id))
    .limit(1);
  return row ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await loadEmail((await params).id);
  return { title: row ? row.email.subject : "Email not found" };
}

export default async function EmailDetailPage({ params }: Props) {
  const row = await loadEmail((await params).id);
  if (!row) notFound();
  const { email, contactName } = row;
  const tz = await getBusinessTimezone();
  const meta = EMAIL_STATUS_META[email.status];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/emails" className="mb-3 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="size-4" aria-hidden /> Email Log
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight break-words text-zinc-900">{email.subject}</h1>
      </div>

      <Card>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-zinc-500">To</dt>
              <dd className="mt-0.5 break-all text-zinc-900">
                {email.contactId ? (
                  <Link href={`/admin/contacts/${email.contactId}`} className="font-medium text-brand-700 hover:underline">
                    {contactName || email.to}
                  </Link>
                ) : (
                  email.to
                )}
                {email.contactId && contactName && <span className="block text-xs text-zinc-500">{email.to}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Sent</dt>
              <dd className="mt-0.5 text-zinc-900">{formatDateTime(email.createdAt, tz)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Type</dt>
              <dd className="mt-0.5">
                <Badge tone="neutral">{humanizeKind(email.kind)}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">Status</dt>
              <dd className="mt-0.5 flex flex-col items-start gap-1">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <span className="text-xs text-zinc-500">{meta.hint}</span>
              </dd>
            </div>
            {email.providerId && (
              <div className="sm:col-span-2 lg:col-span-4">
                <dt className="text-xs font-medium text-zinc-500">Provider message ID</dt>
                <dd className="mt-0.5 font-mono text-xs break-all text-zinc-700">{email.providerId}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {email.status === "failed" && (
        <Card className="border-red-200">
          <CardContent className="flex flex-col gap-4">
            <Alert tone="error" title="This email wasn't delivered">
              <span className="font-mono text-xs break-words">{email.error || "The email provider didn't return an error message."}</span>
            </Alert>
            <p className="text-sm text-zinc-600">
              Common causes: an unverified sending domain, an invalid <code className="font-mono text-xs">EMAIL_FROM</code> address, or a mistyped recipient. Fix the
              cause, then resend.
            </p>
            <ResendButton emailId={email.id} />
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="email-preview-heading" className="flex flex-col gap-2">
        <h2 id="email-preview-heading" className="text-sm font-medium text-zinc-800">
          Email as sent
        </h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-[#f4f4f7] shadow-soft">
          {/* Empty sandbox: no scripts, forms, navigation or same-origin access. */}
          <iframe title={`Email: ${email.subject}`} sandbox="" srcDoc={email.html} className="block h-[42rem] w-full" />
        </div>
      </section>
    </div>
  );
}
