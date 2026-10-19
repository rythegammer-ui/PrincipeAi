import type { Locator, Page } from "@playwright/test";
import { expect, openContact, openLoggedEmail, test, uniqueEmail } from "./helpers";

const CONTACT_STEP = "Where should we send your results?";

/** Answers the current question with its first option and moves on. Returns the question it answered. */
async function answerQuestion(page: Page, quiz: Locator): Promise<string> {
  const heading = quiz.getByRole("heading", { level: 2 });
  const title = (await heading.textContent())?.trim() ?? "";
  const select = quiz.getByRole("combobox");
  const radio = quiz.getByRole("radio");
  if (await select.count()) {
    await select.selectOption({ index: 1 });
  } else if (await radio.count()) {
    // Options are cards around visually hidden inputs; tapping one moves to the next question by itself.
    await quiz.locator("label").filter({ has: page.getByRole("radio") }).first().click();
  } else {
    await quiz.locator("label").filter({ has: page.getByRole("checkbox") }).first().click();
  }
  // Single-choice cards advance on their own; otherwise press Next.
  await expect(async () => {
    if ((await heading.textContent())?.trim() === title) {
      const next = quiz.getByRole("button", { name: "Next" });
      if (await next.isVisible()) await next.click({ timeout: 1_000 });
    }
    await expect(heading).not.toHaveText(title, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  return title;
}

test.describe("AI readiness assessment", () => {
  test("completing the quiz shows the score and plan, and records the contact's quiz activity", async ({ page, adminPage }) => {
    const email = uniqueEmail("quiz");
    await page.goto("/assessment");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The quiz card: the innermost box holding both the progress bar and the current question.
    const quiz = page
      .locator("div")
      .filter({ has: page.getByRole("progressbar", { name: "Assessment progress" }) })
      .filter({ has: page.getByRole("heading", { level: 2 }) })
      .last();
    await expect(quiz.getByText(/Question 1 of \d+/)).toBeVisible();

    const answered: string[] = [];
    for (let i = 0; i < 20; i++) {
      if ((await quiz.getByRole("heading", { level: 2 }).textContent())?.trim() === CONTACT_STEP) break;
      answered.push(await answerQuestion(page, quiz));
    }
    expect(answered.length).toBeGreaterThan(3);
    await expect(quiz.getByRole("heading", { level: 2, name: CONTACT_STEP })).toBeVisible();

    await quiz.getByLabel("First name").fill("Quinn");
    await quiz.getByLabel("Email").fill(email);
    const company = quiz.getByLabel("Company");
    if (await company.isVisible()) await company.fill("Quinn Consulting");
    await quiz.getByRole("button", { name: /See my results/ }).click();

    // Results: score, tier and the plan (the built-in plan without an AI key, streamed like the AI one).
    await expect(page).toHaveURL(/\/assessment\/results\/[\w-]+$/);
    const score = page.getByRole("img", { name: /AI readiness score: \d+ out of 100/ });
    await expect(score).toBeVisible();
    const scoreValue = Number((await score.getAttribute("aria-label"))?.match(/(\d+) out of 100/)?.[1]);
    expect(scoreValue).toBeGreaterThanOrEqual(0);
    expect(scoreValue).toBeLessThanOrEqual(100);
    await expect(page.getByRole("heading", { level: 2, name: "Your personalized AI action plan" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Your personalized plan is ready." })).toBeAttached({ timeout: 30_000 });
    const plan = page.getByRole("article").filter({ has: page.getByRole("heading") });
    await expect(plan).toContainText(/Quinn/);
    expect(((await plan.textContent()) ?? "").length).toBeGreaterThan(200);

    // Reloading shows the stored result (same score).
    await page.reload();
    await expect(page.getByRole("img", { name: `AI readiness score: ${scoreValue} out of 100` })).toBeVisible();

    // CRM: the assessment is on the contact.
    await openContact(adminPage, email);
    await expect(adminPage.getByRole("heading", { level: 3, name: /AI assessment/ })).toBeVisible();
    await expect(adminPage.getByText(`${scoreValue}/100`).first()).toBeVisible();
    await expect(adminPage.getByText(new RegExp(`^Completed AI assessment — ${scoreValue}/100`))).toBeVisible();
    // Results email with the link back to them.
    const results = await openLoggedEmail(adminPage, email, new RegExp(`^Your AI readiness results: ${scoreValue}/100`));
    await expect(results.getByRole("link").filter({ hasText: /results/i }).first()).toHaveAttribute("href", /\/assessment\/results\//);
  });
});
