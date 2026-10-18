import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import type { ChatConversation, ChatMessage } from "@/db/schema";

/** Messages sent to the model as context (most recent). */
export const CONTEXT_MESSAGES = 20;
/** Long-running conversations roll over into a fresh one after this many stored messages. */
export const MAX_STORED_MESSAGES = 120;
/** How many messages the history endpoints return to the browser. */
export const HISTORY_MESSAGES = 60;

const t = schema.chatConversations;

export function jsonError(error: string, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export function chatMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return { role, content, at: new Date().toISOString() };
}

/** A conversation owned by `visitorId` (never return another visitor's chat). */
export async function findOwnedConversation(id: string | undefined, visitorId: string, kind: "assistant" | "tutor"): Promise<ChatConversation | null> {
  if (!id) return null;
  const db = await getDb();
  const [row] = await db
    .select()
    .from(t)
    .where(and(eq(t.id, id), eq(t.visitorId, visitorId), eq(t.kind, kind)))
    .limit(1);
  return row ?? null;
}

export async function createConversation(input: {
  visitorId: string;
  kind: "assistant" | "tutor";
  path: string | null;
  contactId: string | null;
  first: ChatMessage;
}): Promise<ChatConversation> {
  const db = await getDb();
  const [row] = await db
    .insert(t)
    .values({ visitorId: input.visitorId, kind: input.kind, path: input.path, contactId: input.contactId, messages: [input.first] })
    .returning();
  return row;
}

/** Atomically appends messages (jsonb concatenation, so concurrent requests never drop each other's messages). */
export async function appendMessages(conversationId: string, messages: ChatMessage[], patch: { contactId?: string | null } = {}): Promise<void> {
  if (!messages.length && patch.contactId === undefined) return;
  const db = await getDb();
  await db
    .update(t)
    .set({
      ...(messages.length ? { messages: sql`${t.messages} || ${JSON.stringify(messages)}::jsonb` } : {}),
      ...(patch.contactId !== undefined ? { contactId: patch.contactId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(t.id, conversationId));
}

/** True when the stored conversation already ends with this exact visitor message (a client retry). */
export function endsWithUserMessage(messages: ChatMessage[], content: string): boolean {
  const last = messages[messages.length - 1];
  return Boolean(last && last.role === "user" && last.content === content);
}

/** Same-site path for attribution, without query string or fragment. */
export function safePath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  const path = value.split(/[?#]/)[0]?.slice(0, 300) ?? "";
  return /^\/[\w\-./~%@:+]*$/.test(path) ? path : null;
}

/** Pathname of a same-origin Referer header (fallback page attribution). */
export function refererPath(request: Request): string | null {
  const ref = request.headers.get("referer");
  if (!ref) return null;
  try {
    const url = new URL(ref);
    if (url.host !== new URL(request.url).host) return null;
    return safePath(url.pathname);
  } catch {
    return null;
  }
}

/** Public shape of stored messages returned to the browser. */
export function publicMessages(messages: ChatMessage[]): { role: ChatMessage["role"]; content: string }[] {
  return messages.slice(-HISTORY_MESSAGES).map(({ role, content }) => ({ role, content }));
}
