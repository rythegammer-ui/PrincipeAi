import type { Browser, Page } from "@playwright/test";
import { expect, openContact, openLoggedEmail, pathOf, randomClientIp, test, uniqueEmail } from "./helpers";

const LINK_SUBJECT = "Here's your link to the AI Starter Kit";
const INBOX_NOTE = /sending a link to your inbox/;

/** Opts in to the Starter Kit from /free-guide as `email` and waits for the thank-you page. */
async function optIn(page: Page, email: string, name = "Grace"): Promise<void> {
  await page.goto("/free-guide");
  const form = page.locator("form").filter({ has: page.getByRole("button", { name: /Send me the free kit/ }) }).first();
  await form.getByLabel("First name").fill(name);
  await form.getByLabel("Email").fill(email);
  await form.getByText("My business", { exact: true }).click();
  await form.getByRole("button", { name: /Send me the free kit/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: /Your kit is ready/ })).toBeVisible();
}

/** Opts in as `email` from a fresh browser on another network (anyone can type any address into the form). */
async function optInElsewhere(browser: Browser, baseURL: string | undefined, email: string): Promise<{ url: string; promisesEmail: boolean }> {
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
  try {
    const page = await context.newPage();
    await optIn(page, email, "Someone Else");
    // The kit is unlocked in this browser either way.
    await expect(page.getByRole("link", { name: "Open the Starter Kit" })).toBeVisible();
    return { url: pathOf(page.url()), promisesEmail: await page.getByText(INBOX_NOTE).isVisible() };
  } finally {
    await context.close();
  }
}

test.describe("free guide funnel", () => {
  test("opt-in unlocks the guide, creates a lead_magnet contact and sends the welcome email", async ({ page, adminPage, browser, baseURL }) => {
    const email = uniqueEmail("guide");
    const name = "Grace";

    // The guide is locked before opting in.
    await page.goto("/guide");
    await expect(page.getByRole("link", { name: /Unlock the full kit/ })).toBeVisible();

    await page.goto("/free-guide");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: /Send me the free kit/ }) }).first();
    await form.getByLabel("First name").fill(name);
    await form.getByLabel("Email").fill(email);
    // The radios are visually hidden inside their option cards: pick the card, as a visitor would.
    await form.getByText("My business", { exact: true }).click();
    await expect(form.getByRole("radio", { name: "My business" })).toBeChecked();
    await form.getByRole("button", { name: /Send me the free kit/ }).click();

    // Thank-you page → the unlocked guide.
    await expect(page).toHaveURL("/free-guide/thank-you");
    await expect(page.getByRole("heading", { level: 1, name: /Your kit is ready/ })).toBeVisible();
    await page.getByRole("link", { name: "Open the Starter Kit" }).click();
    await expect(page).toHaveURL("/guide");
    await expect(page.getByText(`Welcome, ${name}`)).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Jump to" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Unlock the full kit/ })).toBeHidden();

    // CRM: the contact exists with the free-guide source.
    await adminPage.goto(`/admin/contacts?q=${encodeURIComponent(email)}`);
    const row = adminPage.getByRole("row").filter({ hasText: email });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("cell").filter({ hasText: "Free guide" })).toBeVisible();
    await adminPage.goto(`/admin/contacts?q=${encodeURIComponent(email)}&source=lead_magnet`);
    await expect(adminPage.getByRole("row").filter({ hasText: email })).toHaveCount(1);
    await openContact(adminPage, email);
    await expect(adminPage.getByRole("combobox", { name: "Pipeline stage" })).toHaveValue("new");
    await expect(adminPage.getByText("Downloaded the AI Starter Kit").first()).toBeVisible();

    // Email Log: the welcome email (first step of the nurture sequence) went out, simulated.
    const welcome = await openLoggedEmail(adminPage, email, `Your AI Starter Kit is here, ${name}`);
    await expect(adminPage.getByText("Simulated", { exact: true }).first()).toBeVisible();
    const guideLink = await welcome.getByRole("link", { name: "Open your AI Starter Kit" }).getAttribute("href");
    expect(guideLink).toBeTruthy();

    // The emailed link opens the kit on another device too (no opt-in cookie there).
    const other = await browser.newContext({ baseURL });
    const phone = await other.newPage();
    await phone.goto(pathOf(guideLink!));
    await expect(phone.getByRole("navigation", { name: "Jump to" })).toBeVisible();
    await other.close();
  });

  test("the opt-in form explains what's missing", async ({ page }) => {
    await page.goto("/free-guide");
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: /Send me the free kit/ }) }).first();
    await form.getByLabel("First name").fill("Grace");
    await form.getByLabel("Email").fill("not-an-email");
    await form.getByRole("button", { name: /Send me the free kit/ }).click();
    await expect(form.getByText(/valid email/i)).toBeVisible();
    await expect(page).toHaveURL("/free-guide");
    // What was typed is kept.
    await expect(form.getByLabel("First name")).toHaveValue("Grace");
  });

  test("repeat opt-ins email the kit link at most once a day, and never once the person unsubscribed", async ({ page, adminPage, browser, baseURL }) => {
    const email = uniqueEmail("guide-repeat");
    await optIn(page, email);
    await expect(page).toHaveURL("/free-guide/thank-you");
    await expect(page.getByText(INBOX_NOTE)).toBeVisible();

    // A repeat opt-in gets the link on its own once; after that, the same day, nothing (and no promise of an email).
    expect(await optInElsewhere(browser, baseURL, email)).toEqual({ url: "/free-guide/thank-you", promisesEmail: true });
    expect(await optInElsewhere(browser, baseURL, email)).toEqual({ url: "/free-guide/thank-you?sent=0", promisesEmail: false });
    await openLoggedEmail(adminPage, email, LINK_SUBJECT);
    await adminPage.goto(`/admin/emails?q=${encodeURIComponent(email)}`);
    const log = adminPage.getByRole("table", { name: "Email log" });
    await expect(log.getByRole("link", { name: LINK_SUBJECT })).toHaveCount(1);
    await expect(log.getByRole("link", { name: /^Your AI Starter Kit is here/ })).toHaveCount(1);

    // Someone who unsubscribed (from the link in the welcome email) gets no kit email when their address is used again.
    const other = uniqueEmail("guide-unsub");
    await optIn(page, other);
    const welcome = await openLoggedEmail(adminPage, other, "Your AI Starter Kit is here, Grace");
    const unsubscribe = await welcome.getByRole("link", { name: "Unsubscribe" }).getAttribute("href");
    await page.goto(pathOf(unsubscribe!));
    await page.getByRole("button", { name: "Unsubscribe" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /You.re unsubscribed/ })).toBeVisible();
    expect(await optInElsewhere(browser, baseURL, other)).toEqual({ url: "/free-guide/thank-you?sent=0", promisesEmail: false });
    await adminPage.goto(`/admin/emails?q=${encodeURIComponent(other)}`);
    await expect(log.getByRole("link", { name: /^Your AI Starter Kit is here/ })).toHaveCount(1);
    await expect(log.getByRole("link", { name: LINK_SUBJECT })).toHaveCount(0);
  });
});
