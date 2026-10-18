import { GraduationCap, MessageSquare, MessagesSquare, Search, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CleanGetForm } from "@/components/admin/clean-get-form";
import { Pagination } from "@/components/admin/pagination";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { Avatar, EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { plainText } from "@/lib/chat-fallback";
import { integrations } from "@/lib/integrations";
import { getSettings } from "@/lib/settings";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";
import { InsightsCard } from "./_components/insights-card";
import {
  CONVERSATION_KINDS,
  KIND_LABELS,
  conversationFilterParams,
  conversationStats,
  listConversations,
  parseConversationFilters,
  type ConversationFilters,
  type ConversationRow,
} from "./data";
import { INSIGHTS_SAMPLE, readStoredInsights } from "./insights";

export const metadata: Metadata = { title: "AI Conversations" };

function personFor(row: ConversationRow): { name: string; detail: string | null; known: boolean; email: string | null } {
  if (row.contactEmail) return { name: row.contactName?.trim() || row.contactEmail, detail: row.contactName ? row.contactEmail : null, known: true, email: row.contactEmail };
  if (row.studentEmail) return { name: row.studentName?.trim() || row.studentEmail, detail: row.studentName ? row.studentEmail : "Student", known: true, email: row.studentEmail };
  return { name: row.kind === "tutor" ? "Student" : "Anonymous visitor", detail: null, known: false, email: null };
}

function KindBadge({ kind }: { kind: string }) {
  return kind === "tutor" ? <Badge tone="gold">Tutor</Badge> : <Badge tone="brand">Website</Badge>;
}

function KindTabs({ filters }: { filters: ConversationFilters }) {
  const tabs: { kind: ConversationFilters["kind"]; label: string }[] = [
    { kind: undefined, label: "All" },
    ...CONVERSATION_KINDS.map((kind) => ({ kind, label: KIND_LABELS[kind] })),
  ];
  return (
    <nav aria-label="Conversation type" className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1">
      {tabs.map((tab) => {
        const qs = conversationFilterParams(filters, { kind: tab.kind, page: undefined }).toString();
        const active = filters.kind === tab.kind;
        return (
          <Link
            key={tab.label}
            href={qs ? `/admin/conversations?${qs}` : "/admin/conversations"}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function ConversationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const filters = parseConversationFilters(sp);
  const [{ rows, total, page, pageCount, pageSize }, stats, insights, settings] = await Promise.all([
    listConversations(filters),
    conversationStats(),
    readStoredInsights(),
    getSettings(),
  ]);
  const tz = settings.timezone;
  const now = new Date();
  const hasFilters = Boolean(filters.kind || filters.who || filters.q);
  const hrefFor = (p: number) => {
    const qs = conversationFilterParams(filters, { page: p > 1 ? p : undefined }).toString();
    return qs ? `/admin/conversations?${qs}` : "/admin/conversations";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="AI Conversations"
        description="Every chat with the website assistant and the course tutor — and what prospects keep asking."
        actions={
          <ButtonLink href="/admin/settings" variant="outline" size="sm" className="h-9">
            Assistant settings
          </ButtonLink>
        }
      />

      {sp.deleted === "1" && <Alert tone="success">Conversation deleted.</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Website chats" value={stats.assistant.toLocaleString()} hint="Last 30 days" icon={MessageSquare} />
        <StatCard label="Visitor messages" value={stats.visitorMessages.toLocaleString()} hint="Last 30 days" icon={MessagesSquare} />
        <StatCard
          label="Chats with a known contact"
          value={stats.identified.toLocaleString()}
          hint={stats.assistant ? `${Math.round((stats.identified / stats.assistant) * 100)}% of website chats` : "Last 30 days"}
          icon={UserCheck}
        />
        <StatCard label="Tutor sessions" value={stats.tutor.toLocaleString()} hint="Last 30 days" icon={GraduationCap} />
      </div>

      <InsightsCard
        initial={insights}
        aiConfigured={integrations().ai}
        hasConversations={hasFilters || total > 0 || Boolean(insights)}
        sampleSize={INSIGHTS_SAMPLE}
        tz={tz}
      />

      <section aria-labelledby="conversation-list-title" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="conversation-list-title" className="text-base font-semibold tracking-tight text-zinc-900">
            Conversations
          </h2>
          <KindTabs filters={filters} />
        </div>

        <CleanGetForm
          key={conversationFilterParams(filters).toString()}
          action="/admin/conversations"
          label="Filter conversations"
          className="flex flex-col gap-2 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-soft sm:flex-row"
        >
          {filters.kind && <input type="hidden" name="kind" value={filters.kind} />}
          <div className="relative flex-1">
            <label htmlFor="conversation-search" className="sr-only">
              Search conversations
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
            <Input
              id="conversation-search"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder="Search messages, contact or page…"
              className="h-10 pl-10"
              maxLength={100}
            />
          </div>
          <div className="flex gap-2">
            <label htmlFor="conversation-who" className="sr-only">
              Visitor
            </label>
            <Select id="conversation-who" name="who" defaultValue={filters.who ?? ""} className="h-10 sm:w-48">
              <option value="">Everyone</option>
              <option value="identified">Known contacts</option>
              <option value="anonymous">Anonymous visitors</option>
            </Select>
            <button type="submit" className={buttonVariants({ variant: "secondary", className: "h-10" })}>
              Search
            </button>
          </div>
        </CleanGetForm>

        {hasFilters && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>
              {total.toLocaleString()} matching {total === 1 ? "conversation" : "conversations"}
            </span>
            <Link href="/admin/conversations" className="font-medium text-brand-700 hover:underline">
              Clear filters
            </Link>
          </p>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={hasFilters ? "No conversations match these filters" : "No conversations yet"}
            description={
              hasFilters
                ? "Try a broader search or clear the filters."
                : "When visitors chat with the website assistant or students ask the course tutor a question, the conversations show up here."
            }
            action={
              hasFilters ? (
                <ButtonLink href="/admin/conversations" variant="outline" size="sm">
                  Clear filters
                </ButtonLink>
              ) : (
                <ButtonLink href="/" target="_blank" variant="outline" size="sm">
                  Open the website
                </ButtonLink>
              )
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-soft">
            <Table>
              <caption className="sr-only">AI conversations, most recent first</caption>
              <THead>
                <tr>
                  <TH scope="col">Who</TH>
                  <TH scope="col" className="hidden md:table-cell">
                    Last message
                  </TH>
                  <TH scope="col" className="hidden text-right sm:table-cell">
                    Messages
                  </TH>
                  <TH scope="col" className="hidden lg:table-cell">
                    Page
                  </TH>
                  <TH scope="col" className="text-right">
                    Updated
                  </TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((row) => {
                  const person = personFor(row);
                  const preview = row.lastContent ? plainText(row.lastContent) : "";
                  return (
                    <TR key={row.id} className="relative">
                      <TD className="max-w-[13rem] sm:max-w-xs">
                        <div className="flex items-center gap-3">
                          {person.known ? (
                            <Avatar name={person.name} email={person.email} />
                          ) : (
                            <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200">
                              <MessageSquare className="size-4" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/admin/conversations/${row.id}`}
                              className={cn("block truncate font-medium after:absolute after:inset-0 hover:text-brand-700", person.known ? "text-zinc-900" : "text-zinc-600")}
                            >
                              {person.name}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-1.5">
                              <KindBadge kind={row.kind} />
                              {person.detail && <span className="truncate text-xs text-zinc-500">{person.detail}</span>}
                            </div>
                            {preview && (
                              <p className="mt-1 line-clamp-1 text-xs text-zinc-500 md:hidden">
                                {row.lastRole === "assistant" ? "AI: " : ""}
                                {preview}
                              </p>
                            )}
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden max-w-md md:table-cell">
                        {preview ? (
                          <p className="line-clamp-2 text-sm text-zinc-600">
                            <span className="font-medium text-zinc-400">{row.lastRole === "assistant" ? "AI: " : row.kind === "tutor" ? "Student: " : "Visitor: "}</span>
                            {preview}
                          </p>
                        ) : (
                          <span className="text-sm text-zinc-400">No messages</span>
                        )}
                      </TD>
                      <TD className="hidden text-right tabular-nums sm:table-cell">
                        <span className="font-medium text-zinc-900">{row.messageCount}</span>
                        <span className="block text-xs text-zinc-500">{row.userMessages} from {row.kind === "tutor" ? "student" : "visitor"}</span>
                      </TD>
                      <TD className="hidden max-w-[12rem] lg:table-cell">
                        {row.path ? <span className="block truncate font-mono text-xs text-zinc-600">{row.path}</span> : <span className="text-xs text-zinc-400">—</span>}
                      </TD>
                      <TD className="text-right text-xs whitespace-nowrap text-zinc-500">
                        <time dateTime={row.updatedAt.toISOString()} title={formatDateTime(row.updatedAt, tz)}>
                          {timeAgo(row.updatedAt, now)}
                        </time>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={page} pageCount={pageCount} total={total} pageSize={pageSize} hrefFor={hrefFor} noun="conversations" />
          </div>
        )}
      </section>
    </div>
  );
}
