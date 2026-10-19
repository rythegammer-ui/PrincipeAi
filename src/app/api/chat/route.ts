import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { aiStream, REFUSAL_MESSAGE, textStreamResponse } from "@/lib/ai";
import { buildAssistantSystemPrompt, chatEmailNote, toModelMessages, withNoteOnLastUserMessage } from "@/lib/ai-prompts";
import { buildChatFallback, extractEmail, extractOwnEmail } from "@/lib/chat-fallback";
import { captureLead, contactForVisitor, logActivity, recomputeScore } from "@/lib/crm";
import { rateLimitByIp } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { getVisitorContext, trackEvent } from "@/lib/tracking";
import { absoluteUrl, truncate } from "@/lib/utils";
import {
  CONTEXT_MESSAGES,
  MAX_STORED_MESSAGES,
  appendMessages,
  chatMessage,
  createConversation,
  endsWithUserMessage,
  findOwnedConversation,
  jsonError,
  publicMessages,
  refererPath,
  safePath,
} from "./conversation-store";
import { loadAssistantKnowledge } from "./knowledge";

export const dynamic = "force-dynamic";
// Chat replies are short (effort "low", 4k tokens) — well within every Vercel plan's limit.
export const maxDuration = 60;

const Body = z.object({
  conversationId: z.uuid().optional(),
  message: z
    .string({ message: "Please type a message." })
    .trim()
    .min(1, "Please type a message.")
    .max(2000, "Please keep messages under 2,000 characters."),
  /** Page the visitor is on (for attribution). Sanitized below. */
  path: z.string().max(2000).optional(),
});

/** Fenced block so a visitor's text can't inject links or formatting into the owner email. */
function quoteForEmail(text: string): string {
  return `\`\`\`\n${truncate(text, 1000).replace(/`/g, "'")}\n\`\`\``;
}

/**
 * Website AI assistant. Streams a plain-text (Markdown) reply and returns the conversation id
 * in the X-Conversation-Id header. Works without an API key via a rule-based fallback.
 */
export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const { message } = parsed.data;

  const visitor = await getVisitorContext();
  const visitorId = visitor.visitorId;
  if (!visitorId) return jsonError("Please enable cookies and refresh the page to chat with the assistant.", 400);

  const minute = await rateLimitByIp("chat:min", 20, 60);
  if (!minute.ok) return jsonError("You're sending messages quickly — please wait a minute and try again.", 429, { "Retry-After": "60" });
  const day = await rateLimitByIp("chat:day", 200, 24 * 60 * 60);
  if (!day.ok) return jsonError("You've reached today's chat limit. Please come back tomorrow, or reach us via the contact page.", 429);

  const settings = await getSettings();
  if (!settings.aiAssistantEnabled) return jsonError("The assistant is offline right now. Please use the contact page instead.", 403);

  const path = safePath(parsed.data.path) ?? refererPath(request);
  const userMessage = chatMessage("user", message);

  let conversation = await findOwnedConversation(parsed.data.conversationId, visitorId, "assistant");
  if (conversation && conversation.messages.length >= MAX_STORED_MESSAGES) conversation = null;

  let contactId = conversation?.contactId ?? null;
  if (!contactId) contactId = (await contactForVisitor(visitorId))?.id ?? null;

  const isNew = !conversation;
  let history = conversation?.messages ?? [];
  if (!conversation) {
    conversation = await createConversation({ visitorId, kind: "assistant", path, contactId, first: userMessage });
    history = [userMessage];
  } else if (!endsWithUserMessage(history, message)) {
    // Save the visitor's message right away so it's kept even if the reply stream is interrupted.
    await appendMessages(conversation.id, [userMessage]);
    history = [...history, userMessage];
  }
  const conversationId = conversation.id;

  // Lead capture: only an address the visitor offers as their own ("my email is …", the follow-up form, or just the
  // address). Others — e.g. "write a reminder to my client jane@acme.com" — must never become leads or notifications.
  const email = extractOwnEmail(message);
  let emailCaptured: string | null = null;
  if (email) {
    const db = await getDb();
    const [linked] = contactId
      ? await db.select({ email: schema.contacts.email }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1)
      : [];
    if (linked?.email === email) {
      emailCaptured = email;
    } else if ((await rateLimitByIp("chat:lead", 5, 60 * 60)).ok) {
      try {
        const { contact } = await captureLead({
          email,
          source: "chat",
          activity: { type: "chat", title: "Shared email in AI chat", body: truncate(message, 500), meta: { conversationId, path } },
          event: { name: "chat_lead", path: path ?? undefined, props: { conversationId } },
          stage: "engaged",
          notify: {
            kind: "lead",
            subject: `New lead from the AI chat: ${email}`,
            markdown: `**${email}** shared their email with the AI assistant${path ? ` on ${path}` : ""} and would like a follow-up.\n\nTheir message:\n\n${quoteForEmail(message)}\n\n[Read the full conversation](${absoluteUrl(`/admin/conversations/${conversationId}`)})`,
          },
        });
        contactId = contact.id;
        emailCaptured = email;
      } catch (err) {
        console.error("[chat] lead capture failed", err);
      }
    }
  }

  if (contactId !== conversation.contactId) await appendMessages(conversationId, [], { contactId });

  if (isNew) {
    await trackEvent({ name: "chat_started", path, visitorId, contactId, props: { conversationId } });
    if (contactId && !emailCaptured) {
      try {
        await logActivity(contactId, "chat", "Started a chat with the AI assistant", { body: truncate(message, 500), meta: { conversationId, path } });
        await recomputeScore(contactId);
      } catch (err) {
        console.error("[chat] failed to log chat activity", err);
      }
    }
  }

  const { courses, meetingTypes } = await loadAssistantKnowledge();

  const stream = aiStream({
    system: buildAssistantSystemPrompt({ settings, courses, meetingTypes }),
    // Tell the model whether an address really reached the team (only the visitor's own, and not when rate limited
    // or capture failed) so it never promises a follow-up that isn't coming. The cached system prompt stays unchanged.
    messages: withNoteOnLastUserMessage(
      toModelMessages(history, CONTEXT_MESSAGES),
      chatEmailNote({ emailInMessage: extractEmail(message) !== null, emailCaptured: emailCaptured !== null }),
    ),
    effort: "low",
    maxTokens: 4000,
    fallbackText: buildChatFallback({ message, courses, meetingTypes, emailCaptured }),
    // A refusal shows the refusal sentence (not the non-AI fallback), and a reply the visitor stopped is still saved.
    refusalText: REFUSAL_MESSAGE,
    completeOnCancel: true,
    onComplete: async (fullText) => {
      const reply = fullText.trim();
      if (reply) await appendMessages(conversationId, [chatMessage("assistant", reply)]);
    },
  });

  return textStreamResponse(stream, { headers: { "X-Conversation-Id": conversationId } });
}

/** Stored messages of the visitor's own conversation (used to restore the widget after a page load). */
export async function GET(request: NextRequest) {
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("conversationId"));
  if (!id.success) return jsonError("Invalid conversation.", 400);
  const limit = await rateLimitByIp("chat:history", 60, 60);
  if (!limit.ok) return jsonError("Too many requests.", 429);
  const { visitorId } = await getVisitorContext();
  if (!visitorId) return jsonError("Conversation not found.", 404);
  const conversation = await findOwnedConversation(id.data, visitorId, "assistant");
  if (!conversation) return jsonError("Conversation not found.", 404);
  return NextResponse.json({ id: conversation.id, messages: publicMessages(conversation.messages) }, { headers: { "Cache-Control": "no-store" } });
}
