import "server-only";
import { and, count, desc, eq, gte, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/db";

export const CONVERSATION_KINDS = ["assistant", "tutor"] as const;
export type ConversationKind = (typeof CONVERSATION_KINDS)[number];

export const KIND_LABELS: Record<ConversationKind, string> = {
  assistant: "Website assistant",
  tutor: "Course tutor",
};

export const PAGE_SIZE = 25;

type RawParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FiltersSchema = z.object({
  kind: z.enum(CONVERSATION_KINDS).optional().catch(undefined),
  who: z.enum(["identified", "anonymous"]).optional().catch(undefined),
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .catch(undefined)
    .transform((v) => v || undefined),
  page: z.coerce.number().int().min(1).max(100_000).catch(1),
});
export type ConversationFilters = z.infer<typeof FiltersSchema>;

export function parseConversationFilters(sp: RawParams): ConversationFilters {
  return FiltersSchema.parse({ kind: first(sp.kind) || undefined, who: first(sp.who) || undefined, q: first(sp.q), page: first(sp.page) ?? 1 });
}

export function conversationFilterParams(f: ConversationFilters, overrides: Partial<Record<keyof ConversationFilters, string | number | undefined>> = {}) {
  const merged = { kind: f.kind, who: f.who, q: f.q, page: f.page > 1 ? f.page : undefined, ...overrides };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "") params.set(k, String(v));
  return params;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

const t = schema.chatConversations;
const c = schema.contacts;
const u = schema.users;

/** Number of visitor (user-role) messages in a conversation. */
const userMessageCount = sql<number>`jsonb_array_length(jsonb_path_query_array(${t.messages}, '$[*] ? (@.role == "user")'))::int`;

export async function listConversations(f: ConversationFilters) {
  const db = await getDb();
  const conditions: (SQL | undefined)[] = [
    f.kind ? eq(t.kind, f.kind) : undefined,
    f.who === "identified" ? isNotNull(t.contactId) : f.who === "anonymous" ? isNull(t.contactId) : undefined,
  ];
  if (f.q) {
    const like = `%${escapeLike(f.q)}%`;
    conditions.push(or(ilike(sql`${t.messages}::text`, like), ilike(c.email, like), ilike(c.name, like), ilike(t.path, like)));
  }
  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: t.id,
        kind: t.kind,
        path: t.path,
        visitorId: t.visitorId,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messageCount: sql<number>`jsonb_array_length(${t.messages})::int`,
        userMessages: userMessageCount,
        lastRole: sql<string | null>`${t.messages} -> -1 ->> 'role'`,
        lastContent: sql<string | null>`left(${t.messages} -> -1 ->> 'content', 300)`,
        contactId: c.id,
        contactName: c.name,
        contactEmail: c.email,
        studentName: u.name,
        studentEmail: u.email,
      })
      .from(t)
      .leftJoin(c, eq(c.id, t.contactId))
      .leftJoin(u, sql`${t.visitorId} = 'user:' || ${u.id}::text`)
      .where(where)
      .orderBy(desc(t.updatedAt))
      .limit(PAGE_SIZE)
      .offset((f.page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(t).leftJoin(c, eq(c.id, t.contactId)).where(where),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return { rows, total, page: Math.min(f.page, pageCount), pageCount, pageSize: PAGE_SIZE };
}

export type ConversationRow = Awaited<ReturnType<typeof listConversations>>["rows"][number];

/** Headline numbers for the last 30 days. */
export async function conversationStats() {
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      assistant: sql<number>`(count(*) filter (where ${t.kind} = 'assistant'))::int`,
      tutor: sql<number>`(count(*) filter (where ${t.kind} = 'tutor'))::int`,
      identified: sql<number>`(count(*) filter (where ${t.kind} = 'assistant' and ${t.contactId} is not null))::int`,
      visitorMessages: sql<number>`coalesce(sum(${userMessageCount}) filter (where ${t.kind} = 'assistant'), 0)::int`,
    })
    .from(t)
    .where(gte(t.createdAt, since));
  return {
    assistant: Number(row?.assistant ?? 0),
    tutor: Number(row?.tutor ?? 0),
    identified: Number(row?.identified ?? 0),
    visitorMessages: Number(row?.visitorMessages ?? 0),
  };
}

export async function getConversationDetail(id: string) {
  const db = await getDb();
  const [conversation] = await db.select().from(t).where(eq(t.id, id)).limit(1);
  if (!conversation) return null;
  const studentId = conversation.visitorId.startsWith("user:") ? conversation.visitorId.slice(5) : null;
  const [contact, student] = await Promise.all([
    conversation.contactId
      ? db
          .select({ id: c.id, name: c.name, email: c.email, stage: c.stage, score: c.score, company: c.company, source: c.source })
          .from(c)
          .where(eq(c.id, conversation.contactId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
    studentId && /^[0-9a-f-]{36}$/i.test(studentId)
      ? db
          .select({ id: u.id, name: u.name, email: u.email })
          .from(u)
          .where(eq(u.id, studentId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
  ]);
  return { conversation, contact, student };
}

export type ConversationDetail = NonNullable<Awaited<ReturnType<typeof getConversationDetail>>>;
