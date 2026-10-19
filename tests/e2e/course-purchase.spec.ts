import type { Page } from "@playwright/test";
import { expect, openContact, openLoggedEmail, pathOf, test, uniqueEmail } from "./helpers";

const COURSE = { slug: "ai-essentials", title: "AI Essentials" };

/** Opens a one-time sign-in link on this server and confirms it (the link is a POST so mail scanners can't use it). */
async function openSignInLink(page: Page, link: string) {
  expect(pathOf(link)).toMatch(/^\/auth\/verify\?token=/);
  await page.goto(pathOf(link));
  await expect(page.getByRole("heading", { level: 1, name: /almost in/i })).toBeVisible();
  await page.getByRole("button", { name: "Continue to my courses" }).click();
}

/** Signs a student in through /login: without an email provider (demo mode) the page shows the link itself. */
async function signInAsStudent(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  const devLink = page.getByRole("link", { name: "Sign in now" });
  await expect(devLink).toHaveAttribute("href", /\/auth\/verify\?token=/);
  await openSignInLink(page, (await devLink.getAttribute("href"))!);
}

test.describe("course purchase", () => {
  test("test checkout → success → emailed sign-in → lesson → progress", async ({ page, adminPage }) => {
    const email = uniqueEmail("buyer");
    const name = "Casey Buyer";

    // Sales page → enroll.
    await page.goto("/courses");
    await page.getByRole("link", { name: new RegExp(COURSE.title) }).first().click();
    await expect(page).toHaveURL(`/courses/${COURSE.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: COURSE.title })).toBeVisible();
    const buyBox = page.getByRole("complementary", { name: "Enroll" });
    await expect(buyBox.getByText("Test mode — no real payment will be taken")).toBeVisible();
    await buyBox.getByLabel("Your name").fill(name);
    await buyBox.getByLabel("Email").fill(email);
    await buyBox.getByRole("button", { name: "Enroll now" }).click();

    // Built-in test checkout.
    await expect(page).toHaveURL(/\/checkout\/test\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
    await expect(page.getByText(COURSE.title).first()).toBeVisible();
    await page.getByRole("button", { name: /Complete test purchase/ }).click();

    // Success page.
    await expect(page).toHaveURL(/\/checkout\/success\?order=[0-9a-f-]{36}&session_id=test_/);
    await expect(page.getByRole("heading", { name: "You're in! Welcome aboard." })).toBeVisible();
    await expect(page.getByText("test mode — no real payment was taken", { exact: false })).toBeVisible();

    // The access email and the receipt are in the Email Log. Its one-time sign-in link is stored redacted, so
    // the log can never be used to sign in as the buyer.
    const access = await openLoggedEmail(adminPage, email, `You're in: ${COURSE.title}`);
    const loggedLink = await access.getByRole("link").filter({ hasText: /sign in|start|course/i }).first().getAttribute("href");
    expect(loggedLink).toContain("/auth/verify?token=");
    expect(decodeURIComponent(loggedLink!)).toContain("token=[redacted]");
    await openLoggedEmail(adminPage, email, /^Your receipt from /);

    // The buyer asks the success page for a fresh sign-in link; without an email provider it is shown on the page.
    await page.getByRole("button", { name: "Email me a new sign-in link" }).click();
    const devLink = page.getByRole("link", { name: "sign in now" });
    await expect(devLink).toBeVisible();
    await openSignInLink(page, (await devLink.getAttribute("href"))!);

    // Student portal: the course opens on its first lesson.
    await expect(page).toHaveURL(new RegExp(`/learn/${COURSE.slug}/[\\w-]+$`));
    const lessonUrl = new URL(page.url()).pathname;
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const progressText = page.getByText(/^\d+ of \d+ lessons complete · \d+%$/).first();
    await expect(progressText).toHaveText(/^0 of \d+ lessons complete · 0%$/);

    await page.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByText("Lesson completed")).toBeVisible();
    await expect(progressText).toHaveText(/^1 of \d+ lessons complete · \d+%$/);
    await expect(page.getByRole("button", { name: "Mark as not complete" })).toBeVisible();

    // Progress is stored: it survives a reload, and the CRM shows the student's activity.
    await page.reload();
    await expect(page.getByText(/^1 of \d+ lessons complete/).first()).toBeVisible();
    await openContact(adminPage, email);
    await expect(adminPage.getByRole("combobox", { name: "Pipeline stage" })).toHaveValue("customer");
    await expect(adminPage.getByText(/^Completed lesson: /).first()).toBeVisible();
    await expect(adminPage.getByText(`Purchased ${COURSE.title}`).first()).toBeVisible();

    // Someone who isn't enrolled is sent away from the lesson.
    await page.context().clearCookies();
    await page.goto(lessonUrl);
    await expect(page).toHaveURL(/\/login\?next=/);
    await signInAsStudent(page, uniqueEmail("not-enrolled"), lessonUrl);
    await expect(page).toHaveURL(`/courses/${COURSE.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: COURSE.title })).toBeVisible();
  });
});
