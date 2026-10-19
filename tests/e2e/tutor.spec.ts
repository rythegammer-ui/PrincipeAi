import type { Page } from "@playwright/test";
import { expect, openContact, openSignInLink, signInAsStudent, test, uniqueEmail } from "./helpers";

const COURSE = { slug: "ai-essentials", title: "AI Essentials" };
/** The tutor's non-AI reply (no ANTHROPIC_API_KEY on this server): see buildTutorFallback in src/lib/chat-fallback.ts. */
const FALLBACK_REPLY = "The AI tutor isn't switched on yet";

/** Buys the course through the built-in test checkout and signs in from the success page; ends on the first lesson. */
async function buyCourseAndSignIn(page: Page, buyer: { name: string; email: string }): Promise<void> {
  await page.goto(`/courses/${COURSE.slug}`);
  const buyBox = page.getByRole("complementary", { name: "Enroll" });
  await buyBox.getByLabel("Your name").fill(buyer.name);
  await buyBox.getByLabel("Email").fill(buyer.email);
  await buyBox.getByRole("button", { name: "Enroll now" }).click();
  await expect(page).toHaveURL(/\/checkout\/test\/[0-9a-f-]{36}$/);
  await page.getByRole("button", { name: /Complete test purchase/ }).click();
  await expect(page.getByRole("heading", { name: "You're in! Welcome aboard." })).toBeVisible();
  await page.getByRole("button", { name: "Email me a new sign-in link" }).click();
  const devLink = page.getByRole("link", { name: "sign in now" });
  await expect(devLink).toBeVisible();
  await openSignInLink(page, (await devLink.getAttribute("href"))!);
  await expect(page).toHaveURL(new RegExp(`/learn/${COURSE.slug}/[\\w-]+$`));
}

/** Opens the lesson's AI tutor panel and returns its conversation log. */
async function openTutor(page: Page) {
  await page.getByRole("button", { name: /^Ask the AI tutor/ }).click();
  const log = page.getByRole("log", { name: "Conversation" });
  await expect(log).toContainText("I'm your AI tutor for");
  return log;
}

test.describe("AI course tutor", () => {
  test("an enrolled student gets a streamed reply; a student who isn't enrolled is refused", async ({ page, adminPage }) => {
    const email = uniqueEmail("tutor");
    await buyCourseAndSignIn(page, { name: "Tara Tutee", email });
    const lessonPath = new URL(page.url()).pathname;
    const lessonTitle = ((await page.getByRole("heading", { level: 1 }).textContent()) ?? "").trim();
    expect(lessonTitle.length).toBeGreaterThan(0);

    // Ask a question in the tutor panel.
    const log = await openTutor(page);
    const question = `How would I use this lesson at work? (${Date.now().toString(36)})`;
    const input = page.getByRole("textbox", { name: "Ask the AI tutor a question about this lesson" });
    await input.fill(question);
    const [request, response] = await Promise.all([
      page.waitForRequest((r) => r.url().endsWith("/api/tutor") && r.method() === "POST"),
      page.waitForResponse((r) => r.url().endsWith("/api/tutor") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Send message" }).click(),
    ]);
    const sent = request.postDataJSON() as { courseSlug: string; lessonId: string; message: string };
    expect(sent).toMatchObject({ courseSlug: COURSE.slug, message: question });
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const conversationId = response.headers()["x-conversation-id"];
    expect(conversationId).toMatch(/^[0-9a-f-]{36}$/);

    // The fallback reply streams in, finishes, and is grounded in the lesson.
    await expect(input).toHaveValue("");
    await expect(log).toContainText(question);
    await expect(log).toHaveAttribute("aria-busy", "false", { timeout: 20_000 });
    await expect(log.getByRole("button", { name: "Copy reply" })).toHaveCount(1, { timeout: 20_000 });
    await expect(log).toContainText(FALLBACK_REPLY);
    await expect(log).toContainText(lessonTitle);
    await expect(log).toContainText("key points");

    // The reply really is streamed: it reaches the browser in several chunks.
    const streamed = await page.evaluate(
      async ({ body }) => {
        const res = await fetch("/api/tutor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let chunks = 0;
        let text = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks++;
          text += decoder.decode(value, { stream: true });
        }
        return { status: res.status, chunks, text };
      },
      { body: { courseSlug: sent.courseSlug, lessonId: sent.lessonId, conversationId, message: "Quiz me on this lesson" } },
    );
    expect(streamed.status).toBe(200);
    expect(streamed.chunks, "number of streamed chunks").toBeGreaterThan(1);
    expect(streamed.text).toContain(FALLBACK_REPLY);
    expect(streamed.text).toContain("Quick self-check");

    // The conversation is kept: reopening the lesson restores it.
    await page.reload();
    const restored = await openTutor(page);
    await expect(restored).toContainText(question);
    await expect(restored).toContainText("Quiz me on this lesson");

    // The CRM records the question on the student's timeline.
    await openContact(adminPage, email);
    await expect(adminPage.getByText(`Asked the AI tutor about "${lessonTitle}"`).first()).toBeVisible();

    // Signed out, the tutor asks the student to sign in again.
    await page.context().clearCookies();
    const signedOut = await page.request.post("/api/tutor", { data: { courseSlug: sent.courseSlug, lessonId: sent.lessonId, message: "Hello?" } });
    expect(signedOut.status()).toBe(401);

    // Another student, signed in but not enrolled: refused, and the first student's conversation stays private.
    await signInAsStudent(page, uniqueEmail("tutor-not-enrolled"), "/learn");
    await expect(page).toHaveURL(/\/learn/);
    await page.goto(lessonPath);
    await expect(page).toHaveURL(`/courses/${COURSE.slug}`);
    const refused = await page.request.post("/api/tutor", { data: { courseSlug: sent.courseSlug, lessonId: sent.lessonId, message: "Explain this simply" } });
    expect(refused.status()).toBe(403);
    expect(await refused.json()).toEqual({ error: "The AI tutor is available to students enrolled in this course." });
    const history = await page.request.get(`/api/tutor?conversationId=${conversationId}`);
    expect(history.status()).toBe(404);
  });
});
