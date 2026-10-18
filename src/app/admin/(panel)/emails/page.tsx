import { and, count, desc, eq, gte, ilike, or, type SQL } from "drizzle-orm";
import { Inbox, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { CleanGetForm } from "@/components/admin/clean-get-form";
import { Pagination } from "@/components/admin/pagination";
import { EMAIL_STATUSES, EMAIL_STATUS_META, humanizeKind } from "@/components/funnels/automation-utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDb, schema } from "@/db";
import { integrations } from "@/lib/integrations";
import { getBusinessTimezone } from "@/lib/scheduling";
import { formatDateTime, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Email Log" };

const PAGE_SIZE = 25;
const l = schema.emailLog;

const Filters = z.object({
  q: z
    .string()
    .transform((s) => s.trim().slice(0, 100))
    .catch(""),
  status: z.enum(EMAIL_STATUSES as [string, ...string[]]).optional().catch(undefined),
  kind: z
    .string()
    .regex(/^[a-z0-9_-]{1,40}$/)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
type Filters = z.infer<typeof Filters>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function filterParams(f: Filters, page?: number): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status) p.set("status", f.status);
  if (f.kind) p.set("kind", f.kind);
  if (page && page > 1) p.set("page", String(page));
  return p.toString();
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/** Email counts by status over the last 30 days. */
async function recentStatusCounts() {
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 24 * 3_600_000);
  return db.select({ status: l.status, n: count() }).from(l).where(gte(l.createdAt, since)).groupBy(l.status);
}

export default async function EmailLogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filters = Filters.parse({ q: first(sp.q) ?? "", status: first(sp.status), kind: first(sp.kind), page: first(sp.page) ?? 1 });
  const conds: SQL[] = [];
  if (filters.status) conds.push(eq(l.status, filters.status as (typeof EMAIL_STATUSES)[number]));
  if (filters.kind) conds.push(eq(l.kind, filters.kind));
  if (filters.q) {
    const like = `%${escapeLike(filters.q)}%`;
    conds.push(or(ilike(l.to, like), ilike(l.subject, like))!);
  }
  const where = conds.length ? and(...conds) : undefined;

  const db = await getDb();
  const [[{ total }], kinds, recent, tz] = await Promise.all([
    db.select({ total: count() }).from(l).where(where),
    db.selectDistinct({ kind: l.kind }).from(l).orderBy(l.kind),
    recentStatusCounts(),
    getBusinessTimezone(),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const rows = await db
    .select({
      id: l.id,
      to: l.to,
      subject: l.subject,
      kind: l.kind,
      status: l.status,
      contactId: l.contactId,
      createdAt: l.createdAt,
      contactName: schema.contacts.name,
    })
    .from(l)
    .leftJoin(schema.contacts, eq(schema.contacts.id, l.contactId))
    .where(where)
    .orderBy(desc(l.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const recentCounts = Object.fromEntries(recent.map((r) => [r.status, Number(r.n)])) as Partial<Record<(typeof EMAIL_STATUSES)[number], number>>;
  const hasFilters = Boolean(filters.q || filters.status || filters.kind);
  const hrefFor = (p: number) => {
    const qs = filterParams(filters, p);
    return qs ? `/admin/emails?${qs}` : "/admin/emails";
  };
  const emailOn = integrations().email;

  return (
    <div>
      <PageHeader title="Email Log" description="Every email the platform sends (automations, confirmations, receipts and login links) in one place." />

      {!emailOn && (
        <Alert tone="info" className="mb-4" title="Email delivery isn't connected yet">
          Emails are recorded here as <strong>simulated</strong> so you can check them, but nothing is delivered until you add a Resend API key.{" "}
          <Link href="/admin/settings#integrations" className="font-medium underline">
            Set up email
          </Link>
        </Alert>
      )}

      <section aria-label="Last 30 days" className="mb-4 flex flex-wrap gap-2 text-sm">
        <span className="mr-1 self-center text-zinc-500">Last 30 days:</span>
        {EMAIL_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/emails?status=${s}`}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 shadow-xs hover:border-zinc-300"
          >
            <Badge tone={EMAIL_STATUS_META[s].tone}>{EMAIL_STATUS_META[s].label}</Badge>
            <span className="font-semibold text-zinc-900 tabular-nums">{(recentCounts[s] ?? 0).toLocaleString()}</span>
          </Link>
        ))}
      </section>

      <CleanGetForm
        key={filterParams(filters)}
        action="/admin/emails"
        label="Filter emails"
        className="mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-soft sm:p-4 md:flex-row"
      >
        <div className="relative flex-1">
          <label htmlFor="email-search" className="sr-only">
            Search recipient or subject
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <Input id="email-search" name="q" type="search" defaultValue={filters.q} placeholder="Search recipient or subject…" className="h-10 pl-10" maxLength={100} />
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex">
          <div>
            <label htmlFor="email-status" className="sr-only">
              Status
            </label>
            <Select id="email-status" name="status" defaultValue={filters.status ?? ""} className="h-10 md:w-40">
              <option value="">All statuses</option>
              {EMAIL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EMAIL_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="email-kind" className="sr-only">
              Type
            </label>
            <Select id="email-kind" name="kind" defaultValue={filters.kind ?? ""} className="h-10 md:w-48">
              <option value="">All types</option>
              {kinds.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {humanizeKind(k.kind)}
                </option>
              ))}
            </Select>
          </div>
          <button type="submit" className={buttonVariants({ variant: "secondary", className: "col-span-2 h-10" })}>
            Search
          </button>
        </div>
      </CleanGetForm>

      {hasFilters && (
        <p className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          {total.toLocaleString()} matching {total === 1 ? "email" : "emails"}
          <Link href="/admin/emails" className="font-medium text-brand-700 hover:underline">
            Clear filters
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={hasFilters ? "No emails match these filters" : "No emails yet"}
          description={
            hasFilters
              ? "Try a broader search or clear the filters."
              : "Emails appear here as soon as the platform sends one: an opt-in, a booking confirmation, an automation step or a login link."
          }
          action={
            hasFilters ? (
              <ButtonLink href="/admin/emails" variant="outline" size="sm">
                Clear filters
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
          <Table>
            <caption className="sr-only">Email log</caption>
            <THead>
              <tr>
                <TH scope="col" className="hidden lg:table-cell">
                  Date
                </TH>
                <TH scope="col">Email</TH>
                <TH scope="col" className="hidden md:table-cell">
                  To
                </TH>
                <TH scope="col" className="hidden xl:table-cell">
                  Type
                </TH>
                <TH scope="col" className="text-right">
                  Status
                </TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => {
                const meta = EMAIL_STATUS_META[r.status];
                return (
                  <TR key={r.id}>
                    <TD className="hidden whitespace-nowrap text-xs text-zinc-500 tabular-nums lg:table-cell">{formatDateTime(r.createdAt, tz)}</TD>
                    <TD className="max-w-[14rem] sm:max-w-md">
                      <Link href={`/admin/emails/${r.id}`} className="block truncate font-medium text-zinc-900 hover:text-brand-700 hover:underline" title={r.subject}>
                        {truncate(r.subject, 120)}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">
                        <span className="lg:hidden">{formatDateTime(r.createdAt, tz)} · </span>
                        <span className="md:hidden">{r.to} · </span>
                        <span className="xl:hidden">{humanizeKind(r.kind)}</span>
                      </p>
                    </TD>
                    <TD className="hidden max-w-[16rem] md:table-cell">
                      {r.contactId ? (
                        <Link href={`/admin/contacts/${r.contactId}`} className="block truncate text-zinc-800 hover:text-brand-700 hover:underline">
                          {r.contactName || r.to}
                        </Link>
                      ) : (
                        <span className="block truncate text-zinc-800">{r.to}</span>
                      )}
                      {r.contactId && r.contactName && <span className="block truncate text-xs text-zinc-500">{r.to}</span>}
                    </TD>
                    <TD className="hidden xl:table-cell">
                      <Badge tone="neutral">{humanizeKind(r.kind)}</Badge>
                    </TD>
                    <TD className="text-right">
                      <Badge tone={meta.tone} title={meta.hint}>
                        {meta.label}
                      </Badge>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={PAGE_SIZE} hrefFor={hrefFor} noun="emails" />
        </div>
      )}
    </div>
  );
}
