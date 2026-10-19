import { E2E_CRON_SECRET } from "./env";
import { expect, loginAsAdmin, test, uniqueEmail } from "./helpers";

test.describe("security regressions", () => {
  test("admin pages redirect to the login page without a session", async ({ page }) => {
    for (const path of ["/admin", "/admin/contacts", "/admin/settings", "/admin/emails"]) {
      await page.goto(path);
      await expect(page).toHaveURL(`/admin/login?next=${encodeURIComponent(path)}`);
      await expect(page.getByRole("heading", { level: 1, name: "Sign in to your dashboard" })).toBeVisible();
    }
  });

  test("the contacts CSV export refuses requests without a session", async ({ request }) => {
    const response = await request.get("/api/admin/contacts/export", { maxRedirects: 0 });
    expect(response.status()).not.toBe(200);
    expect([307, 401, 403]).toContain(response.status());
    expect(response.headers()["content-type"] ?? "").not.toContain("text/csv");
    if (response.status() === 307) expect(response.headers()["location"]).toMatch(/\/admin\/login/);
    const body = await response.text();
    expect(body).not.toContain("@example.com");
  });

  test("admin server actions refuse a browser whose session is gone", async ({ adminPage }) => {
    // Open a contact as the admin, then lose the session (expired / signed out elsewhere) and submit a form.
    await adminPage.goto("/admin/contacts?sort=score");
    await adminPage.getByRole("table", { name: "Contacts" }).getByRole("row").nth(1).getByRole("link").first().click();
    await expect(adminPage).toHaveURL(/\/admin\/contacts\/[0-9a-f-]{36}$/);
    const contactUrl = new URL(adminPage.url()).pathname;
    const note = `Note without a session ${Date.now().toString(36)}`;
    await adminPage.getByRole("textbox", { name: "Note", exact: true }).fill(note);
    await adminPage.context().clearCookies();
    await adminPage.getByRole("button", { name: "Add note" }).last().click();

    // The action refuses and sends the browser to the login page.
    await expect(adminPage).toHaveURL(/\/admin\/login/);
    await expect(adminPage.getByRole("heading", { level: 1, name: "Sign in to your dashboard" })).toBeVisible();

    // Nothing was saved.
    await loginAsAdmin(adminPage, contactUrl);
    await expect(adminPage).toHaveURL(contactUrl);
    await expect(adminPage.getByRole("heading", { level: 3, name: /Timeline/ })).toBeVisible();
    await expect(adminPage.getByText(note)).toHaveCount(0);
  });

  test("/api/cron refuses calls without the cron secret", async ({ request }) => {
    const none = await request.get("/api/cron");
    expect(none.status()).toBe(401);
    expect((await none.json()).ok).toBe(false);

    const wrong = await request.get("/api/cron", { headers: { Authorization: "Bearer not-the-secret" } });
    expect(wrong.status()).toBe(401);

    const query = await request.get(`/api/cron?secret=${encodeURIComponent(E2E_CRON_SECRET)}`);
    expect(query.status(), "the secret is only accepted in the Authorization header").toBe(401);

    // The server started by playwright.config.ts has CRON_SECRET set; another server needs E2E_CRON_SECRET.
    test.skip(Boolean(process.env.E2E_BASE_URL) && !process.env.E2E_CRON_SECRET, "E2E_CRON_SECRET is not set for this server");
    const ok = await request.get("/api/cron", { headers: { Authorization: `Bearer ${E2E_CRON_SECRET}` } });
    expect(ok.status()).toBe(200);
    const summary = await ok.json();
    expect(summary.ok).toBe(true);
    expect(Object.keys(summary.jobs)).toEqual(expect.arrayContaining(["automations", "bookingReminders", "expiredHolds"]));
  });

  test("the admin login never redirects off-site", async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    for (const next of ["https://example.com", "//example.com/admin", "/\\example.com", "https:example.com"]) {
      await page.context().clearCookies();
      await loginAsAdmin(page, next);
      expect(new URL(page.url()).origin).toBe(origin);
      await expect(page).toHaveURL(/\/admin(\/login.*)?$/);
    }
    // A same-site `next` is honoured.
    await page.context().clearCookies();
    await loginAsAdmin(page, "/admin/settings");
    await expect(page).toHaveURL("/admin/settings");
  });

  test("the student login never redirects off-site", async ({ page, baseURL }) => {
    await page.goto("/login?next=https://example.com/steal");
    await page.getByLabel("Email address").fill(uniqueEmail("redirect"));
    await page.getByRole("button", { name: "Email me a sign-in link" }).click();
    const link = page.getByRole("link", { name: "Sign in now" });
    await expect(link).toHaveAttribute("href", /\/auth\/verify\?token=/);
    const href = new URL((await link.getAttribute("href"))!);
    await page.goto(href.pathname + href.search);
    await page.getByRole("button", { name: "Continue to my courses" }).click();
    await expect(page).toHaveURL(/\/learn$/);
    expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
  });

  test("security headers are set on pages", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"] ?? headers["content-security-policy"] ?? "").toBeTruthy();
  });
});
