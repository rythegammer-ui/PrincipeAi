import { readFileSync } from "node:fs";
import path from "node:path";
import type { APIRequestContext, Page } from "@playwright/test";
import { aiServerAvailable, MOCK_ANTHROPIC_URL, MOCK_CLAUDE_MARKER } from "./env";
import { completeAssessment, expect, openContact, test, uniqueEmail } from "./helpers";

/**
 * The real Claude code path (src/lib/ai.ts → @anthropic-ai/sdk → HTTP), run by the `ai` project against a server
 * whose ANTHROPIC_BASE_URL is the mock Messages API in tests/e2e/mock-anthropic.ts. Each test checks what the page
 * shows (every mock reply contains MOCK_CLAUDE_MARKER) and what the app sent to the API.
 */
test.skip(!aiServerAvailable(), "E2E_BASE_URL points at another server: set E2E_AI_BASE_URL (and E2E_MOCK_ANTHROPIC_URL) to run the AI tests");

type MessagesBody = {
  model: string;
  max_tokens: number;
  stream?: boolean;
  system?: unknown;
  messages: { role: string; content: unknown }[];
  output_config?: { effort?: string };
  fallbacks?: unknown;
  thinking?: { type?: string; budget_tokens?: number };
  [key: string]: unknown;
};
type RecordedCall = { id: number; method: string; path: string; headers: Record<string, string>; body: MessagesBody };

/** Read from src/lib/ai.ts, so the check follows the beta the app actually opts in to. */
const FALLBACK_BETA = readFileSync(path.join(__dirname, "../../src/lib/ai.ts"), "utf8").match(/const FALLBACK_BETA = "([^"]+)"/)?.[1];
/** src/lib/ai.ts: ANTHROPIC_MODEL, else Claude Opus 5.5 (playwright.config.ts passes the shell's ANTHROPIC_MODEL on). */
const EXPECTED_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

/** The Messages API calls the mock received whose messages mention `needle` (case-insensitive). */
async function callsMentioning(request: APIRequestContext, needle: string): Promise<RecordedCall[]> {
  const res = await request.get(`${MOCK_ANTHROPIC_URL}/__requests`);
  expect(res.ok(), "mock Anthropic API reachable").toBe(true);
  const calls = (await res.json()) as RecordedCall[];
  return calls.filter((c) => c.path.startsWith("/v1/messages") && JSON.stringify(c.body.messages).toLowerCase().includes(needle.toLowerCase()));
}

/** Waits for exactly one call mentioning `needle` and returns it. */
async function oneCallMentioning(request: APIRequestContext, needle: string): Promise<RecordedCall> {
  let calls: RecordedCall[] = [];
  await expect(async () => {
    calls = await callsMentioning(request, needle);
    expect(calls).toHaveLength(1);
  }).toPass({ timeout: 10_000 });
  return calls[0];
}

/** The request shape src/lib/ai.ts promises for every call (aiText and aiStream both use the streaming helper). */
function expectClaudeRequest(call: RecordedCall, expected: { effort: "low" | "medium"; system: RegExp }) {
  expect(FALLBACK_BETA, "FALLBACK_BETA in src/lib/ai.ts").toBeTruthy();
  expect(call.method).toBe("POST");
  expect(call.path).toBe("/v1/messages?beta=true");
  expect(call.headers["x-api-key"]).toBe("test-key");
  expect(call.headers["anthropic-version"]).toBeTruthy();
  expect(call.headers["anthropic-beta"]?.split(",").map((b) => b.trim())).toContain(FALLBACK_BETA);

  const { body } = call;
  expect(body.model).toBe(EXPECTED_MODEL);
  expect(body.stream).toBe(true);
  expect(body.max_tokens).toBeGreaterThan(0);
  expect(body.output_config?.effort).toBe(expected.effort);
  // The server-side refusal fallback: the beta header above plus the body parameter.
  expect(body.fallbacks).toBe("default");
  // Opus 5.5: no sampling parameters, and no fixed thinking budget (adaptive thinking only).
  for (const key of ["temperature", "top_p", "top_k"]) expect(body, `no ${key}`).not.toHaveProperty(key);
  expect(body.thinking?.budget_tokens).toBeUndefined();

  expect(body.messages.length).toBeGreaterThan(0);
  expect(body.messages[0].role).toBe("user");
  expect(body.messages.at(-1)?.role).toBe("user");

  // The system prompt goes as one cacheable text block.
  expect(Array.isArray(body.system), "system is a list of blocks").toBe(true);
  const system = body.system as { type: string; text: string; cache_control?: { type: string } }[];
  expect(system).toHaveLength(1);
  expect(system[0]).toMatchObject({ type: "text", cache_control: { type: "ephemeral" } });
  expect(system[0].text).toMatch(expected.system);
}

/** Letters only (names keep letters and drop digits), so a first name can identify one test's requests. */
function uniqueLetters(n = 8): string {
  return Array.from({ length: n }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
}

async function createContact(adminPage: Page, name: string, email: string) {
  await adminPage.goto("/admin/contacts/new");
  await adminPage.getByLabel("Full name").fill(name);
  await adminPage.getByLabel(/^Email/).fill(email);
  await adminPage.getByLabel("Company").fill("Fabrikam Studio");
  await adminPage.getByLabel("First note").fill("Wants to automate client onboarding with AI.");
  await adminPage.getByRole("button", { name: "Create contact" }).click();
  await expect(adminPage).toHaveURL(/\/admin\/contacts\/[0-9a-f-]{36}$/);
}

test.describe("Claude (mock Anthropic API)", () => {
  test("the chat assistant streams Claude's reply, and the transcript keeps it", async ({ page, adminPage, request }) => {
    const ref = `ref-${Date.now().toString(36)}`;
    const question = `Which course should I start with? (${ref})`;

    await page.goto("/courses");
    await page.getByRole("button", { name: /^Ask AI/ }).click();
    const chat = page.getByRole("dialog", { name: /Assistant/ });
    const log = chat.getByRole("log", { name: "Conversation" });
    await chat.getByRole("textbox", { name: /^Message / }).fill(question);
    await chat.getByRole("button", { name: "Send message" }).click();
    await expect(log).toContainText(question);
    await expect(log).toHaveAttribute("aria-busy", "false", { timeout: 20_000 });
    await expect(log.getByRole("button", { name: "Copy reply" })).toHaveCount(1, { timeout: 20_000 });
    await expect(log).toContainText(`${MOCK_CLAUDE_MARKER} reply`);
    await expect(log).toContainText("streamed in several pieces like a real Claude reply");

    const call = await oneCallMentioning(request, ref);
    expectClaudeRequest(call, { effort: "low", system: /^You are .*, the AI assistant on the .* website\./ });

    // The stored transcript has Claude's reply.
    await adminPage.goto(`/admin/conversations?q=${encodeURIComponent(ref)}`);
    const rows = adminPage.getByRole("table", { name: /AI conversations/ }).getByRole("row");
    await expect(rows).toHaveCount(2);
    await rows.nth(1).getByRole("link").first().click();
    await expect(adminPage.getByRole("main")).toContainText(`${MOCK_CLAUDE_MARKER} reply`);
  });

  test("the assessment plan is written by Claude and stored with the results", async ({ page, request }) => {
    const firstName = `Ada${uniqueLetters()}`;
    await page.goto("/assessment");
    await completeAssessment(page, { firstName, email: uniqueEmail("ai-quiz") });

    await expect(page).toHaveURL(/\/assessment\/results\/[\w-]+$/);
    await expect(page.getByRole("status").filter({ hasText: "Your personalized plan is ready." })).toBeAttached({ timeout: 30_000 });
    const plan = page.getByRole("article").filter({ has: page.getByRole("heading") });
    await expect(plan).toContainText(`${MOCK_CLAUDE_MARKER} reply`);
    await expect(plan.getByRole("heading", { name: new RegExp(MOCK_CLAUDE_MARKER) })).toBeVisible();

    const call = await oneCallMentioning(request, firstName);
    expectClaudeRequest(call, { effort: "medium", system: /^You are an expert AI implementation coach at / });
    expect(JSON.stringify(call.body.messages)).toContain("<assessment>");

    // Stored: a reload shows the same plan without asking Claude again.
    await page.reload();
    await expect(plan).toContainText(`${MOCK_CLAUDE_MARKER} reply ${call.id}`);
    await page.waitForLoadState("networkidle");
    expect(await callsMentioning(request, firstName)).toHaveLength(1);
  });

  test("admin: Summarize contact writes the sales brief with Claude", async ({ adminPage, request }) => {
    const email = uniqueEmail("ai-brief");
    const name = `Sam Summary ${uniqueLetters()}`;
    await createContact(adminPage, name, email);
    const brief = adminPage.getByRole("region", { name: "AI sales brief" });
    await brief.getByRole("button", { name: "Summarize contact" }).click();
    await expect(brief).toContainText(`${MOCK_CLAUDE_MARKER} reply`, { timeout: 20_000 });
    await expect(brief.getByText("Claude", { exact: true })).toBeVisible();
    await expect(brief.getByRole("button", { name: "Regenerate" })).toBeEnabled();

    // The CRM record names the contact (only the domain of their email address is sent).
    const call = await oneCallMentioning(request, name);
    expectClaudeRequest(call, { effort: "medium", system: /sales-ready brief about ONE contact/ });
    expect(JSON.stringify(call.body.messages)).not.toContain(email);

    // Stored on the contact.
    await openContact(adminPage, email);
    await expect(adminPage.getByRole("region", { name: "AI sales brief" })).toContainText(`${MOCK_CLAUDE_MARKER} reply ${call.id}`);
  });

  test("admin: Draft with AI writes an automation email with Claude", async ({ adminPage, request }) => {
    const workingSubject = `Working subject ${uniqueLetters()}`;
    // Replacing the typed subject and discarding the draft both ask for confirmation.
    adminPage.on("dialog", (dialog) => void dialog.accept());

    await adminPage.goto("/admin/sequences");
    await adminPage.getByRole("table", { name: "Email automations" }).getByRole("link", { name: "Free Guide Nurture" }).click();
    await expect(adminPage.getByRole("heading", { level: 1, name: /Free Guide Nurture/ })).toBeVisible();
    await adminPage.getByRole("button", { name: "Add email" }).first().click();
    const editor = adminPage.getByRole("region", { name: /^New email \d+$/ });
    await expect(editor).toBeVisible();
    const subject = editor.getByLabel("Subject line");
    await subject.fill(workingSubject);

    await editor.getByRole("button", { name: "Draft with AI" }).click();
    await expect(editor.getByText("Drafted with AI.", { exact: false })).toBeVisible({ timeout: 20_000 });
    await expect(subject).toHaveValue(`${MOCK_CLAUDE_MARKER} subject line for you`);
    await expect(editor.getByLabel("Email body (Markdown)")).toHaveValue(new RegExp(`^Hi \\{\\{firstName\\}\\},[\\s\\S]*${MOCK_CLAUDE_MARKER}`));

    const call = await oneCallMentioning(request, workingSubject);
    expectClaudeRequest(call, { effort: "medium", system: /^You write email-automation copy for / });
    expect(JSON.stringify(call.body.messages)).toContain('Automation: \\"Free Guide Nurture\\"');

    // Discard the draft: the automation is unchanged.
    await editor.getByRole("button", { name: "Cancel" }).click();
    await expect(editor).toBeHidden();
    await adminPage.reload();
    await expect(adminPage.getByText(`${MOCK_CLAUDE_MARKER} subject line for you`)).toHaveCount(0);
  });
});
