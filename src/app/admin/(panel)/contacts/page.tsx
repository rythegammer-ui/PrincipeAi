import { Download, Search, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CleanGetForm } from "@/components/admin/clean-get-form";
import { SEGMENTS, SEGMENT_LABELS, STAGE_META, STAGE_ORDER, displayName, sourceLabel, utmSourceLabel } from "@/components/admin/crm-utils";
import { Pagination } from "@/components/admin/pagination";
import { ScoreMeter } from "@/components/admin/score-meter";
import { StageBadge } from "@/components/admin/stage-badge";
import { Alert } from "@/components/ui/alert";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Avatar, EmptyState, PageHeader } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { CONTACT_SORTS, contactFacets, contactFilterParams, listContacts, parseContactFilters } from "@/lib/crm-queries";
import { formatMoney, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Contacts" };

const SCORE_OPTIONS = [
  { value: "", label: "Any score" },
  { value: "30", label: "30+ (warm)" },
  { value: "60", label: "60+ (hot)" },
  { value: "80", label: "80+ (very hot)" },
];

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const filters = parseContactFilters(sp);
  const [{ rows, total, page, pageCount, pageSize }, facets] = await Promise.all([listContacts(filters), contactFacets()]);
  const now = new Date();
  const hasFilters = Boolean(filters.q || filters.stage || filters.source || filters.tag || filters.segment || filters.minScore);
  const exportHref = `/api/admin/contacts/export?${contactFilterParams(filters, { page: undefined }).toString()}`;
  const hrefFor = (p: number) => {
    const qs = contactFilterParams(filters, { page: p > 1 ? p : undefined }).toString();
    return qs ? `/admin/contacts?${qs}` : "/admin/contacts";
  };
  const deleted = sp.deleted === "1";

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${facets.total.toLocaleString()} ${facets.total === 1 ? "person" : "people"} in your CRM — every lead, student and client in one place.`}
        actions={
          <>
            <a href={exportHref} className={buttonVariants({ variant: "outline", size: "sm", className: "h-9" })} download>
              <Download aria-hidden /> Export CSV
            </a>
            <ButtonLink href="/admin/contacts/new" size="sm" className="h-9">
              <UserPlus aria-hidden /> New contact
            </ButtonLink>
          </>
        }
      />

      {deleted && (
        <Alert tone="success" className="mb-4">
          Contact deleted.
        </Alert>
      )}

      <CleanGetForm key={contactFilterParams(filters).toString()} action="/admin/contacts" label="Filter contacts" className="mb-4 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-soft sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label htmlFor="contact-search" className="sr-only">
              Search contacts
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <Input id="contact-search" name="q" type="search" defaultValue={filters.q} placeholder="Search name, email or company…" className="h-10 pl-10" maxLength={100} />
          </div>
          <div className="flex gap-2">
            <label htmlFor="contact-sort" className="sr-only">
              Sort by
            </label>
            <Select id="contact-sort" name="sort" defaultValue={filters.sort} className="h-10 sm:w-44">
              {Object.entries(CONTACT_SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <button type="submit" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
              Search
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <FilterSelect id="f-stage" name="stage" label="Stage" value={filters.stage}>
            <option value="">All stages</option>
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s].label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="f-source" name="source" label="Source" value={filters.source}>
            <option value="">All sources</option>
            {facets.sources.map((s) => (
              <option key={s.source} value={s.source}>
                {sourceLabel(s.source)} ({s.n})
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="f-tag" name="tag" label="Tag" value={filters.tag}>
            <option value="">All tags</option>
            {facets.tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect id="f-segment" name="segment" label="Interest" value={filters.segment}>
            <option value="">All interests</option>
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {SEGMENT_LABELS[s]}
              </option>
            ))}
            <option value="none">Not set</option>
          </FilterSelect>
          <FilterSelect id="f-score" name="minScore" label="Lead score" value={filters.minScore ? String(filters.minScore) : ""} className="col-span-2 md:col-span-1">
            {SCORE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
        </div>
        {hasFilters && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>
              {total.toLocaleString()} matching {total === 1 ? "contact" : "contacts"}
            </span>
            <Link href="/admin/contacts" className="font-medium text-brand-700 hover:underline">
              Clear filters
            </Link>
          </p>
        )}
      </CleanGetForm>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "No contacts match these filters" : "No contacts yet"}
          description={
            hasFilters
              ? "Try a broader search or clear the filters."
              : "Contacts are created automatically from opt-ins, assessments, bookings, chats and purchases. You can also add one by hand."
          }
          action={
            hasFilters ? (
              <ButtonLink href="/admin/contacts" variant="outline" size="sm">
                Clear filters
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/contacts/new" size="sm">
                <UserPlus aria-hidden /> Add a contact
              </ButtonLink>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
          <Table>
            <caption className="sr-only">Contacts</caption>
            <THead>
              <tr>
                <TH scope="col">Contact</TH>
                <TH scope="col" className="hidden lg:table-cell">
                  Company
                </TH>
                <TH scope="col">Stage</TH>
                <TH scope="col" className="hidden sm:table-cell">
                  Score
                </TH>
                <TH scope="col" className="hidden md:table-cell">
                  Source
                </TH>
                <TH scope="col" className="hidden xl:table-cell">
                  Tags
                </TH>
                <TH scope="col" className="hidden text-right md:table-cell">
                  LTV
                </TH>
                <TH scope="col" className="hidden text-right sm:table-cell">
                  Last activity
                </TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <TR key={r.id} className="relative">
                  <TD className="max-w-[14rem] sm:max-w-xs">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.name} email={r.email} />
                      <div className="min-w-0">
                        <Link href={`/admin/contacts/${r.id}`} className="block truncate font-medium text-zinc-900 after:absolute after:inset-0 hover:text-brand-700">
                          {displayName(r)}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">{r.name ? r.email : r.company ?? ""}</p>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden max-w-[12rem] truncate lg:table-cell">{r.company ?? <span className="text-zinc-400">—</span>}</TD>
                  <TD>
                    <StageBadge stage={r.stage} />
                  </TD>
                  <TD className="hidden sm:table-cell">
                    <ScoreMeter score={r.score} barClassName="w-12" />
                  </TD>
                  <TD className="hidden whitespace-nowrap md:table-cell">
                    <span className="block text-zinc-700">{sourceLabel(r.source)}</span>
                    {r.utmSource && <span className="block text-xs text-zinc-500">{utmSourceLabel(r.utmSource)}</span>}
                  </TD>
                  <TD className="hidden xl:table-cell">
                    <div className="flex max-w-[12rem] flex-wrap gap-1">
                      {r.tags.slice(0, 2).map((t) => (
                        <span key={t} className="max-w-[7rem] truncate rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600" title={t}>
                          {t}
                        </span>
                      ))}
                      {r.tags.length > 2 && (
                        <span className="text-xs text-zinc-500" title={r.tags.slice(2).join(", ")}>
                          +{r.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </TD>
                  <TD className="hidden text-right tabular-nums md:table-cell">
                    {r.lifetimeValueCents ? formatMoney(r.lifetimeValueCents) : <span className="text-zinc-400">—</span>}
                  </TD>
                  <TD className="hidden text-right text-xs whitespace-nowrap text-zinc-500 sm:table-cell">
                    <time dateTime={r.lastActivityAt.toISOString()}>{timeAgo(r.lastActivityAt, now)}</time>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} hrefFor={hrefFor} />
        </div>
      )}
    </div>
  );
}

function FilterSelect({ id, name, label, value, className, children }: { id: string; name: string; label: string; value?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select id={id} name={name} defaultValue={value ?? ""} className="h-10 text-sm" aria-label={label}>
        {children}
      </Select>
    </div>
  );
}
