import { expect, test } from "./helpers";

test.describe("AI chat widget", () => {
  test("a visitor chats with the assistant and the conversation shows in admin", async ({ page, adminPage }) => {
    const ref = `ref-${Date.now().toString(36)}`;
    const question = `Which course should I start with if I'm new to AI? (${ref})`;

    await page.goto("/courses");
    await page.getByRole("button", { name: /^Ask AI/ }).click();
    const chat = page.getByRole("dialog", { name: /Principe AI Assistant/ });
    await expect(chat).toBeVisible();
    const log = chat.getByRole("log", { name: "Conversation" });
    // The greeting from Admin → Settings opens the conversation.
    await expect(log).toContainText("Ask me anything");

    const input = chat.getByRole("textbox", { name: /^Message / });
    await input.fill(question);
    await chat.getByRole("button", { name: "Send message" }).click();
    await expect(input).toHaveValue("");
    await expect(log).toContainText(question);

    // The reply streams in (the built-in fallback answer without an AI key) and finishes.
    await expect(log).toHaveAttribute("aria-busy", "false", { timeout: 20_000 });
    await expect(log.getByRole("button", { name: "Copy reply" })).toHaveCount(1, { timeout: 20_000 });
    const reply = await log.textContent();
    expect(reply!.slice(reply!.indexOf(ref) + ref.length).trim().length, "assistant reply text").toBeGreaterThan(40);
    await expect(log).toContainText(/course|Essentials/i);

    // Closing and reopening keeps the conversation.
    await chat.getByRole("button", { name: "Close chat" }).click();
    await expect(chat).toBeHidden();
    await page.getByRole("button", { name: /^Ask AI/ }).click();
    await expect(page.getByRole("dialog").getByRole("log")).toContainText(question);

    // Admin → AI Conversations lists it with both messages.
    await adminPage.goto(`/admin/conversations?q=${encodeURIComponent(ref)}`);
    const rows = adminPage.getByRole("table", { name: /AI conversations/ }).getByRole("row");
    await expect(rows).toHaveCount(2); // header + this conversation
    await rows.nth(1).getByRole("link").first().click();
    await expect(adminPage).toHaveURL(/\/admin\/conversations\/[0-9a-f-]{36}$/);
    const transcript = adminPage.getByRole("main");
    await expect(transcript).toContainText(question);
    await expect(transcript).toContainText(/course|Essentials/i);
  });
});
