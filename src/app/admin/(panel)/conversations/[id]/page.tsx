import { ArrowLeft, ExternalLink, GraduationCap, MessageSquare, Sparkles, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sourceLabel } from "@/components/admin/crm-utils";
import { ScoreMeter } from "@/components/admin/score-meter";
import { StageBadge } from "@/components/admin/stage-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Avatar, EmptyState } from "@/components/ui/misc";
import type { ChatMessage } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { formatDateTime } from "@/lib/utils";
import { DeleteConversationButton } from "../_components/delete-conversation-button";
import { KIND_LABELS, getConversationDetail, type ConversationKind } from "../data";

export const metadata: Metadata = { title: "Conversation" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatTime(iso: string, tz: string): string | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : formatDateTime(d, tz);
}

function TranscriptMessage({ message, tz, isTutor }: { message: ChatMessage; tz: string; isTutor: boolean }) {
  const time = formatTime(message.at, tz);
  if (message.role === "user") {
    return (
      <li className="flex flex-col items-end gap-1">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap text-white [overflow-wrap:anywhere]">
          {message.content}
        </div>
        <p className="text-[11px] text-zinc-400">
          {isTutor ? "Student" : "Visitor"}
          {time && (
            <>
              {" · "}
              <time dateTime={message.at}>{time}</time>
            </>
          )}
        </p>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2.5">
      <span aria-hidden className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 max-w-[calc(100%-2.5rem)]">
        <div className="rounded-2xl rounded-tl-md bg-zinc-50 px-3.5 py-2.5 ring-1 ring-zinc-200/80 [overflow-wrap:anywhere]">
          <Markdown className="prose-sm prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-pre:my-2 prose-pre:text-xs [&_pre]:whitespace-pre-wrap [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-zinc-100 [&>:first-child]:mt-0 [&>:last-child]:mb-0">
            {message.content}
          </Markdown>
        </div>
        <p className="mt-1 text-[11px] text-zinc-400">
          {isTutor ? "AI tutor" : "AI assistant"}
          {time && (
            <>
              {" · "}
              <time dateTime={message.at}>{time}</time>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-900">{children}</dd>
    </div>
  );
}

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [data, settings] = await Promise.all([getConversationDetail(id), getSettings()]);
  if (!data) notFound();
  const { conversation, contact, student } = data;
  const tz = settings.timezone;
  const isTutor = conversation.kind === "tutor";
  const kindLabel = KIND_LABELS[conversation.kind as ConversationKind] ?? conversation.kind;
  const userCount = conversation.messages.filter((m) => m.role === "user").length;
  const title = isTutor ? "AI tutor session" : "Website assistant chat";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/conversations" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="size-4" aria-hidden /> All conversations
        </Link>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {title}
              {isTutor ? <Badge tone="gold">Tutor</Badge> : <Badge tone="brand">Website</Badge>}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {contact?.name || contact?.email || student?.email || "Anonymous visitor"} · started {formatDateTime(conversation.createdAt, tz)} ·{" "}
              {conversation.messages.length} {conversation.messages.length === 1 ? "message" : "messages"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            {conversation.messages.length ? (
              <ol className="flex flex-col gap-5" aria-label="Messages">
                {conversation.messages.map((m, i) => (
                  <TranscriptMessage key={`${m.at}-${i}`} message={m} tz={tz} isTutor={isTutor} />
                ))}
              </ol>
            ) : (
              <EmptyState icon={MessageSquare} title="No messages" description="This conversation was started but has no messages." />
            )}
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{isTutor ? "Student" : "Contact"}</CardTitle>
            </CardHeader>
            <CardContent>
              {contact ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={contact.name} email={contact.email} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">{contact.name || contact.email}</p>
                      {contact.name && <p className="truncate text-sm text-zinc-500">{contact.email}</p>}
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs font-medium text-zinc-500">Stage</dt>
                      <dd className="mt-1">
                        <StageBadge stage={contact.stage} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-zinc-500">Lead score</dt>
                      <dd className="mt-1">
                        <ScoreMeter score={contact.score} />
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs font-medium text-zinc-500">First source</dt>
                      <dd className="mt-0.5 text-zinc-900">{sourceLabel(contact.source)}</dd>
                    </div>
                  </dl>
                  <ButtonLink href={`/admin/contacts/${contact.id}`} variant="outline" size="sm" className="w-full">
                    <UserRound aria-hidden /> Open contact
                  </ButtonLink>
                </div>
              ) : student ? (
                <div className="flex items-center gap-3">
                  <Avatar name={student.name} email={student.email} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-900">{student.name || student.email}</p>
                    {student.name && <p className="truncate text-sm text-zinc-500">{student.email}</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <span aria-hidden className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200">
                    {isTutor ? <GraduationCap className="size-4" /> : <UserRound className="size-4" />}
                  </span>
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium text-zinc-900">Anonymous visitor.</span> If they share their email in the chat, they&apos;re added to your CRM and linked
                    here automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-zinc-100">
                <DetailRow label="Type">{kindLabel}</DetailRow>
                <DetailRow label="Started">{formatDateTime(conversation.createdAt, tz)}</DetailRow>
                <DetailRow label="Last activity">{formatDateTime(conversation.updatedAt, tz)}</DetailRow>
                <DetailRow label="Messages">
                  {userCount} from the {isTutor ? "student" : "visitor"} · {conversation.messages.length - userCount} from the AI
                </DetailRow>
                <DetailRow label={isTutor ? "Lesson" : "Started on page"}>
                  {conversation.path ? (
                    isTutor ? (
                      <span className="font-mono text-xs break-all">{conversation.path}</span>
                    ) : (
                      <a href={conversation.path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs break-all text-brand-700 hover:underline">
                        {conversation.path}
                        <ExternalLink className="size-3 shrink-0" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    )
                  ) : (
                    <span className="text-zinc-400">Unknown</span>
                  )}
                </DetailRow>
                {!isTutor && (
                  <DetailRow label="Visitor ID">
                    <span className="font-mono text-xs break-all text-zinc-600">{conversation.visitorId}</span>
                  </DetailRow>
                )}
              </dl>
            </CardContent>
          </Card>

          <DeleteConversationButton id={conversation.id} />
        </aside>
      </div>
    </div>
  );
}
