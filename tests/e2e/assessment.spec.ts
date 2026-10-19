import { completeAssessment, expect, openContact, openLoggedEmail, test, uniqueEmail } from "./helpers";

test.describe("AI readiness assessment", () => {
  test("completing the quiz shows the score and plan, and records the contact's quiz activity", async ({ page, adminPage }) => {
    const email = uniqueEmail("quiz");
    await page.goto("/assessment");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const answered = await completeAssessment(page, { firstName: "Quinn", email, company: "Quinn Consulting" });
    expect(answered.length).toBeGreaterThan(3);

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
