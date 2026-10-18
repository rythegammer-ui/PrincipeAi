import { Mail, Plus, Zap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { asc, sql } from "drizzle-orm";
import { ActiveToggle } from "@/components/funnels/active-toggle";
import { TRIGGER_META, TRIGGERS } from "@/components/funnels/automation-utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import { integrations } from "@/lib/integrations";

export const metadata: Metadata = { title: "Email Automations" };

const s = schema.emailSequences;
const n = (q: ReturnType<typeof sql>) => sql<number>`${q}`.mapWith(Number);

async function listSequences() {
  const db = await getDb();
  return db
    .select({
      id: s.id,
      name: s.name,
      description: s.description,
      trigger: s.trigger,
      active: s.active,
      steps: n(sql`(select count(*) from sequence_steps st where st.sequence_id = ${s.id})`),
      enrolled: n(sql`(select count(*) from sequence_enrollments e where e.sequence_id = ${s.id})`),
      inProgress: n(sql`(select count(*) from sequence_enrollments e where e.sequence_id = ${s.id} and e.status = 'active')`),
      completed: n(sql`(select count(*) from sequence_enrollments e where e.sequence_id = ${s.id} and e.status = 'completed')`),
      sent: n(sql`(select count(*) from activities a where a.type = 'email_sent' and a.meta->>'sequenceId' = ${s.id}::text)`),
    })
    .from(s)
    .orderBy(sql`array_position(array[${sql.join(TRIGGERS.map((t) => sql`${t}`), sql`, `)}]::text[], ${s.trigger})`, asc(s.createdAt));
}

const fmt = (v: number) => v.toLocaleString("en-US");

export default async function SequencesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const [rows, status] = await Promise.all([listSequences(), Promise.resolve(integrations())]);
  const totals = rows.reduce((t, r) => ({ inProgress: t.inProgress + r.inProgress, sent: t.sent + r.sent }), { inProgress: 0, sent: 0 });

  return (
    <div>
      <PageHeader
        title="Email Automations"
        description={
          rows.length
            ? `${fmt(totals.inProgress)} ${totals.inProgress === 1 ? "person is" : "people are"} moving through your automations right now · ${fmt(totals.sent)} emails sent so far.`
            : "Send the right email at the right moment, automatically."
        }
        actions={
          <ButtonLink href="/admin/sequences/new" size="sm" className="h-9">
            <Plus aria-hidden /> New automation
          </ButtonLink>
        }
      />

      {sp.deleted === "1" && (
        <Alert tone="success" className="mb-4">
          Automation deleted.
        </Alert>
      )}
      {!status.email && (
        <Alert tone="info" className="mb-4" title="Emails are being simulated">
          Without a <code className="font-mono text-xs">RESEND_API_KEY</code>, automation emails are logged in the Email Log instead of delivered.{" "}
          <Link href="/admin/settings#integrations" className="font-medium underline">
            Set up email delivery
          </Link>
        </Alert>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No automations yet"
          description="Automations send a series of emails when someone downloads your guide, completes the assessment, books a call or buys a course."
          action={
            <ButtonLink href="/admin/sequences/new" size="sm">
              <Plus aria-hidden /> Create your first automation
            </ButtonLink>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
          <Table>
            <caption className="sr-only">Email automations</caption>
            <THead>
              <tr>
                <TH scope="col">Automation</TH>
                <TH scope="col">Status</TH>
                <TH scope="col" className="hidden text-right sm:table-cell">
                  Emails
                </TH>
                <TH scope="col" className="hidden text-right md:table-cell">
                  Enrolled
                </TH>
                <TH scope="col" className="hidden text-right md:table-cell">
                  In progress
                </TH>
                <TH scope="col" className="hidden text-right lg:table-cell">
                  Completed
                </TH>
                <TH scope="col" className="text-right">
                  Sent
                </TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id}>
                  <TD className="max-w-[15rem] sm:max-w-md">
                    <Link href={`/admin/sequences/${r.id}`} className="font-medium text-zinc-900 hover:text-brand-700 hover:underline">
                      {r.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
                      <Zap className="size-3 text-gold-500" aria-hidden />
                      <span className="sr-only">Trigger:</span>
                      {TRIGGER_META[r.trigger]?.label ?? r.trigger}
                      {r.steps === 0 && (
                        <Badge tone="amber" className="ml-1">
                          No emails yet
                        </Badge>
                      )}
                    </p>
                    {r.description && <p className="mt-1 line-clamp-2 hidden text-xs text-zinc-500 sm:block">{r.description}</p>}
                  </TD>
                  <TD>
                    <ActiveToggle sequenceId={r.id} name={r.name} active={r.active} />
                  </TD>
                  <TD className="hidden text-right tabular-nums sm:table-cell">{fmt(r.steps)}</TD>
                  <TD className="hidden text-right tabular-nums md:table-cell">{fmt(r.enrolled)}</TD>
                  <TD className="hidden text-right tabular-nums md:table-cell">{fmt(r.inProgress)}</TD>
                  <TD className="hidden text-right tabular-nums lg:table-cell">{fmt(r.completed)}</TD>
                  <TD className="text-right font-medium text-zinc-900 tabular-nums">{fmt(r.sent)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      )}
      <p className="mt-4 text-xs text-zinc-500">
        Automations send on a schedule: each run of the background job (daily on Vercel Hobby, or hourly on Pro) delivers every email that&apos;s due. Emails
        set to send immediately go out straight away. Unsubscribed contacts are always skipped.
      </p>
    </div>
  );
}
