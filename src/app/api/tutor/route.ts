import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
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
} from "@/app/api/chat/conversation-store";
import { aiStream, textStreamResponse } from "@/lib/ai";
import { buildTutorSystemPrompt, toModelMessages } from "@/lib/ai-prompts";
import { getStudent } from "@/lib/auth";
import { buildTutorFallback } from "@/lib/chat-fallback";
import { logActivity } from "@/lib/crm";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  courseSlug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, "Invalid course."),
  lessonId: z.uuid({ message: "Invalid lesson." }),
  conversationId: z.uuid().optional(),
  message: z
    .string({ message: "Please type a question." })
    .trim()
    .min(1, "Please type a question.")
    .max(2000, "Please keep questions under 2,000 characters."),
});

/** Tutor conversations are owned by the student, not the anonymous visitor cookie. */
const ownerId = (userId: string) => `user:${userId}`;

/** Loads the course + lesson and checks the student is enrolled. Returns an error response otherwise. */
async function loadLessonForStudent(userId: string, courseSlug: string, lessonId: string) {
  const db = await getDb();
  const [course] = await db.select().from(schema.courses).where(eq(schema.courses.slug, courseSlug)).limit(1);
  if (!course) return { error: jsonError("Course not found.", 404) } as const;
  const [enrolled] = await db
    .select({ courseId: schema.enrollments.courseId })
    .from(schema.enrollments)
    .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, course.id)))
    .limit(1);
  if (!enrolled) return { error: jsonError("The AI tutor is available to students enrolled in this course.", 403) } as const;
  const [lesson] = await db
    .select()
    .from(schema.lessons)
    .where(and(eq(schema.lessons.id, lessonId), eq(schema.lessons.courseId, course.id)))
    .limit(1);
  if (!lesson) return { error: jsonError("Lesson not found.", 404) } as const;
  return { course, lesson } as const;
}

/** AI course tutor for enrolled students. Streams a Markdown reply; conversation id in X-Conversation-Id. */
export async function POST(request: NextRequest) {
  const user = await getStudent();
  if (!user) return jsonError("Please sign in again to use the AI tutor.", 401);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const { courseSlug, lessonId, message } = parsed.data;

  const minute = await rateLimit(`tutor:min:${user.id}`, 15, 60);
  if (!minute.ok) return jsonError("You're asking questions quickly — please wait a minute and try again.", 429, { "Retry-After": "60" });
  const day = await rateLimit(`tutor:day:${user.id}`, 150, 24 * 60 * 60);
  if (!day.ok) return jsonError("You've reached today's tutor limit. It resets tomorrow — keep going with the lesson in the meantime!", 429);

  const loaded = await loadLessonForStudent(user.id, courseSlug, lessonId);
  if ("error" in loaded) return loaded.error;
  const { course, lesson } = loaded;

  const visitorId = ownerId(user.id);
  const path = `/learn/${course.slug}/${lesson.slug}`;
  const userMessage = chatMessage("user", message);

  let conversation = await findOwnedConversation(parsed.data.conversationId, visitorId, "tutor");
  // One conversation per lesson; very long ones roll over.
  if (conversation && (conversation.path !== path || conversation.messages.length >= MAX_STORED_MESSAGES)) conversation = null;

  let history = conversation?.messages ?? [];
  if (!conversation) {
    conversation = await createConversation({ visitorId, kind: "tutor", path, contactId: user.contactId, first: userMessage });
    history = [userMessage];
    if (user.contactId) {
      await logActivity(user.contactId, "ai", `Asked the AI tutor about "${lesson.title}"`, {
        body: message.slice(0, 500),
        meta: { conversationId: conversation.id, course: course.slug, lesson: lesson.slug },
      }).catch((err) => console.error("[tutor] failed to log activity", err));
    }
  } else if (!endsWithUserMessage(history, message)) {
    await appendMessages(conversation.id, [userMessage]);
    history = [...history, userMessage];
  }
  const conversationId = conversation.id;

  const stream = aiStream({
    system: buildTutorSystemPrompt({ course, lesson }),
    messages: toModelMessages(history, CONTEXT_MESSAGES),
    effort: "low",
    maxTokens: 4000,
    fallbackText: buildTutorFallback({ lessonTitle: lesson.title, lessonSummary: lesson.summary, lessonContent: lesson.content, message }),
    onComplete: async (fullText) => {
      const reply = fullText.trim();
      if (reply) await appendMessages(conversationId, [chatMessage("assistant", reply)]);
    },
  });

  return textStreamResponse(stream, { headers: { "X-Conversation-Id": conversationId } });
}

/** The signed-in student's own tutor conversation (to restore the panel on page load). */
export async function GET(request: NextRequest) {
  const user = await getStudent();
  if (!user) return jsonError("Please sign in again.", 401);
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("conversationId"));
  if (!id.success) return jsonError("Invalid conversation.", 400);
  const conversation = await findOwnedConversation(id.data, ownerId(user.id), "tutor");
  if (!conversation) return jsonError("Conversation not found.", 404);
  return NextResponse.json({ id: conversation.id, messages: publicMessages(conversation.messages) }, { headers: { "Cache-Control": "no-store" } });
}
