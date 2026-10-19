import { test as base, expect, type Browser, type BrowserContext, type FrameLocator, type Page } from "@playwright/test";
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
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
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
