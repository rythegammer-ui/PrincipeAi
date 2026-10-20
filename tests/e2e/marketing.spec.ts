import { collectErrors, expect, test } from "./helpers";

/** Every public page a visitor can reach from the navigation, footer or a funnel. */
const PUBLIC_PAGES = [
  "/",
  "/about",
  "/consulting",
  "/contact",
  "/courses",
  "/courses/ai-essentials",
  "/courses/ai-for-business",
  "/free-guide",
  "/guide",
  "/assessment",
  "/book",
  "/book/ai-strategy-call",
  "/privacy",
  "/terms",
  "/login",
  "/sales-team",
  "/sales-team/terms",
  "/agent/login",
];

test.describe("marketing site", () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} renders without errors`, async ({ page }) => {
      const errors = collectErrors(page);
      const response = await page.goto(path);
      expect(response?.status(), `HTTP status of ${path}`).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await expect(page.getByRole("main")).toBeVisible();
      // Let client components hydrate (and report any errors) before checking.
      await page.waitForLoadState("networkidle");
      expect(errors, `console errors on ${path}`).toEqual([]);
    });
  }

  test("unknown pages return the 404 page", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("the header navigation reaches every main section", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [label, path] of [
      ["Courses", "/courses"],
      ["AI Implementation", "/consulting"],
      ["Free AI Assessment", "/assessment"],
      ["Free Guide", "/free-guide"],
      ["About", "/about"],
    ] as const) {
      await nav.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    }
  });
});

test.describe("mobile @mobile", () => {
  async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth, "page is wider than the screen").toBeLessThanOrEqual(innerWidth);
  }

  test("home page fits a 390px screen and the menu opens @mobile", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    expect(page.viewportSize()?.width).toBe(390);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The desktop navigation is hidden on phones.
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
    await page.waitForLoadState("networkidle");
    await expectNoHorizontalOverflow(page);

    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
    for (const label of ["Courses", "AI Implementation", "Free AI Assessment", "Free Guide", "About", "Student login"]) {
      await expect(menu.getByRole("link", { name: label })).toBeVisible();
    }

    // Escape closes the menu and returns focus to the toggle.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

    // Links in the menu navigate (and close it).
    await page.getByRole("button", { name: "Open menu" }).click();
    await menu.getByRole("link", { name: "Courses" }).click();
    await expect(page).toHaveURL("/courses");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  for (const path of ["/courses", "/free-guide", "/assessment", "/book/ai-strategy-call", "/courses/ai-essentials", "/sales-team"]) {
    test(`${path} fits a 390px screen @mobile`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalOverflow(page);
    });
  }
});
