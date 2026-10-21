import { test as base, expect, type Browser, type BrowserContext, type FrameLocator, type Locator, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./env";

type StorageState = Awaited<ReturnType<BrowserContext["storageState"]>>;

/**
 * A random private client address. The app rate-limits by client IP (taken from X-Forwarded-For, which Vercel
 * sets), so every test and the admin sign-in use their own address: tests don't use up each other's limits.
 */
export function randomClientIp(): string {
  const n = () => 1 + Math.floor(Math.random() * 254);
  return `10.${n()}.${n()}.${n()}`;
}

/** A unique, obviously fake address for this test run (example.com never receives mail). */
export function uniqueEmail(prefix = "e2e"): string {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  return `${prefix}-${stamp}@example.com`;
}

/** Signs in through the admin login form and waits for the dashboard (or the `next` page). */
export async function loginAsAdmin(page: Page, next?: string): Promise<void> {
  await page.goto(next ? `/admin/login?next=${encodeURIComponent(next)}` : "/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(E2E_ADMIN.email);
  await page.getByLabel("Password").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).not.toHaveURL(/\/admin\/login/);
}

/** The path + query of a link (emails and dev sign-in links carry the server's configured site URL). */
export function pathOf(link: string): string {
  const url = new URL(link, "http://placeholder.invalid");
  return url.pathname + url.search;
}

/** Console errors and uncaught page errors, for "no errors on this page" checks. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

/**
 * Opens the newest logged email to `to` whose subject matches (a string matches part of it), in Admin → Email Log, and returns the frame
 * that shows it as sent. Emails are simulated (no Resend key), so the log is the inbox. Retries briefly:
 * some emails are sent right after the response that triggered them.
 */
export async function openLoggedEmail(adminPage: Page, to: string, subject: string | RegExp): Promise<FrameLocator> {
  const link = adminPage.getByRole("table", { name: "Email log" }).getByRole("link", { name: subject }).first();
  await expect(async () => {
    await adminPage.goto(`/admin/emails?q=${encodeURIComponent(to)}`);
    await expect(link).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await link.click();
  const heading = adminPage.getByRole("heading", { level: 1 });
  if (typeof subject === "string") await expect(heading).toContainText(subject);
  else await expect(heading).toHaveText(subject);
  await expect(adminPage.getByText(to, { exact: true }).first()).toBeVisible();
  return adminPage.frameLocator('iframe[title^="Email: "]');
}

/** Finds a contact by email in Admin → Contacts and opens their page. */
export async function openContact(adminPage: Page, email: string): Promise<void> {
  const row = adminPage.getByRole("row").filter({ hasText: email });
  await expect(async () => {
    await adminPage.goto(`/admin/contacts?q=${encodeURIComponent(email)}`);
    await expect(row).toHaveCount(1, { timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await row.getByRole("link").first().click();
  await expect(adminPage.getByRole("link", { name: email })).toBeVisible();
}

/**
 * Opens a one-time sign-in link on this server and confirms it (the link is a POST so mail scanners can't use it).
 * The button says where it leads: a student's courses, a sales agent's dashboard, or the admin dashboard.
 */
export async function openSignInLink(page: Page, link: string, button = "Continue to my courses"): Promise<void> {
  expect(pathOf(link)).toMatch(/^\/auth\/verify\?token=/);
  await page.goto(pathOf(link));
  await expect(page.getByRole("heading", { level: 1, name: /almost in/i })).toBeVisible();
  await page.getByRole("button", { name: button }).click();
}

/** Signs a student in through /login: without an email provider (demo mode) the page shows the link itself. */
export async function signInAsStudent(page: Page, email: string, next: string): Promise<void> {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  const devLink = page.getByRole("link", { name: "Sign in now" });
  await expect(devLink).toHaveAttribute("href", /\/auth\/verify\?token=/);
  await openSignInLink(page, (await devLink.getAttribute("href"))!);
}

/**
 * Picks the first open time in a slot picker (the calendar opens on the first day with open times; when the
 * current month is fully booked it offers the next one). Returns the chosen time's label, e.g. "9:00 AM".
 */
export async function pickFirstAvailableTime(scope: Locator): Promise<string> {
  const times = scope.getByRole("list", { name: /^Available times on / });
  await expect(async () => {
    if (!(await times.isVisible())) {
      const nextMonth = scope.getByRole("button", { name: /^Check / });
      if (await nextMonth.isVisible()) await nextMonth.click({ timeout: 1_000 });
    }
    await expect(times).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  // The booking's current time (when rescheduling) is listed but disabled.
  const slot = times.getByRole("button", { disabled: false }).first();
  const label = ((await slot.textContent()) ?? "").trim();
  await slot.click();
  return label;
}

/** Heading of the assessment's last step (the contact details). */
export const ASSESSMENT_CONTACT_STEP = "Where should we send your results?";

/** The assessment quiz card: the innermost box holding both the progress bar and the current question. */
export function assessmentQuiz(page: Page): Locator {
  return page
    .locator("div")
    .filter({ has: page.getByRole("progressbar", { name: "Assessment progress" }) })
    .filter({ has: page.getByRole("heading", { level: 2 }) })
    .last();
}

/** Answers the current assessment question with its first option and moves on. Returns the question it answered. */
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

/**
 * On /assessment: answers every question with its first option, fills in the contact step and submits. Returns the
 * questions answered. The page then moves to the results.
 */
export async function completeAssessment(page: Page, person: { firstName: string; email: string; company?: string }): Promise<string[]> {
  const quiz = assessmentQuiz(page);
  await expect(quiz.getByText(/Question 1 of \d+/)).toBeVisible();
  const answered: string[] = [];
  for (let i = 0; i < 20; i++) {
    if ((await quiz.getByRole("heading", { level: 2 }).textContent())?.trim() === ASSESSMENT_CONTACT_STEP) break;
    answered.push(await answerQuestion(page, quiz));
  }
  await expect(quiz.getByRole("heading", { level: 2, name: ASSESSMENT_CONTACT_STEP })).toBeVisible();
  await quiz.getByLabel("First name").fill(person.firstName);
  await quiz.getByLabel("Email").fill(person.email);
  const company = quiz.getByLabel("Company");
  if (person.company && (await company.isVisible())) await company.fill(person.company);
  await quiz.getByRole("button", { name: /See my results/ }).click();
  return answered;
}

async function adminContext(browser: Browser, baseURL: string | undefined, storageState: StorageState): Promise<BrowserContext> {
  return browser.newContext({ baseURL, storageState, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
}

/**
 * `adminPage`: a page signed in to the admin dashboard, in its own browser context (separate from the visitor's
 * `page`, like the owner checking the CRM on another device). The sign-in happens once per worker, so the suite
 * stays well inside the admin login rate limit.
 */
export const test = base.extend<{ adminPage: Page }, { adminState: StorageState }>({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, provide) => {
    await provide({ ...extraHTTPHeaders, "x-forwarded-for": randomClientIp() });
  },
  adminState: [
    async ({ browser }, provide, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL;
      const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
      const page = await context.newPage();
      await loginAsAdmin(page);
      const state = await context.storageState();
      await context.close();
      await provide(state);
    },
    { scope: "worker" },
  ],
  adminPage: async ({ browser, adminState, baseURL }, provide) => {
    const context = await adminContext(browser, baseURL, adminState);
    const page = await context.newPage();
    await provide(page);
    await context.close();
  },
});

export { expect };
