import type { Locator } from "@playwright/test";
import { expect, openLoggedEmail, test, uniqueEmail } from "./helpers";

/**
 * Picks the first open time in a slot picker (the calendar opens on the first day with open times; when the
 * current month is fully booked it offers the next one). Returns the chosen time's label, e.g. "9:00 AM".
 */
async function pickFirstAvailableTime(scope: Locator): Promise<string> {
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

test.describe("booking a free strategy call", () => {
  test("book → confirmation → manage → reschedule → cancel, visible in admin", async ({ page, adminPage }) => {
    const email = uniqueEmail("call");
    const name = `Bea Booker ${Date.now().toString(36)}`;

    await page.goto("/book");
    await page.getByRole("link", { name: /Free AI Strategy Call/ }).first().click();
    await expect(page).toHaveURL("/book/ai-strategy-call");
    await expect(page.getByRole("heading", { level: 1, name: "Free AI Strategy Call" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pick a day and time" })).toBeVisible();

    const main = page.getByRole("main");
    const firstTime = await pickFirstAvailableTime(main);
    await expect(page.getByRole("heading", { name: "Tell us a little about you" })).toBeVisible();
    await expect(main.getByText(firstTime).first()).toBeVisible();

    await page.getByLabel("Your name").fill(name);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("What's the #1 thing you'd like AI to help you with?").fill("Automate our client onboarding emails.");
    await page.getByRole("button", { name: "Confirm booking" }).click();

    // Confirmation page.
    await expect(page).toHaveURL(/\/book\/confirmed\/[0-9a-f]{32}/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/You.re booked, Bea!/);
    await expect(page.getByText(email).first()).toBeVisible();
    const token = page.url().match(/confirmed\/([0-9a-f]{32})/)![1];

    // The confirmation email carries the calendar invite and the manage link.
    const confirmation = await openLoggedEmail(adminPage, email, /^Confirmed: Free AI Strategy Call/);
    await expect(confirmation.getByRole("link", { name: /reschedule|cancel|manage/i }).first()).toHaveAttribute("href", new RegExp(`/booking/${token}$`));

    // Admin → Bookings lists it as upcoming and confirmed.
    await adminPage.goto("/admin/bookings");
    const adminRow = adminPage.getByRole("listitem").filter({ has: adminPage.getByRole("link", { name }) });
    await expect(adminRow).toBeVisible();
    await expect(adminRow).toContainText("Free AI Strategy Call");
    await expect(adminRow).toContainText(/Confirmed/);

    // Manage page → reschedule to another open time.
    await page.getByRole("link", { name: "Reschedule or cancel your booking" }).click();
    await expect(page).toHaveURL(`/booking/${token}`);
    await expect(page.getByRole("heading", { level: 1, name: "Manage your booking" })).toBeVisible();
    await page.getByRole("button", { name: "Reschedule" }).click();
    const reschedule = page.getByRole("region", { name: "Pick a new time" });
    await expect(reschedule).toBeVisible();
    await pickFirstAvailableTime(reschedule);
    await reschedule.getByRole("button", { name: "Confirm new time" }).click();
    await expect(page).toHaveURL(`/booking/${token}?updated=rescheduled`);
    await expect(page.getByText("Your booking has been moved")).toBeVisible();
    await openLoggedEmail(adminPage, email, /^Updated: Free AI Strategy Call moved to/);

    // Cancel it.
    await page.getByRole("button", { name: "Cancel booking" }).click();
    const cancel = page.getByRole("region", { name: "Cancel this booking?" });
    await cancel.getByLabel("Reason (optional)").fill("Found a time with a colleague instead.");
    await cancel.getByRole("button", { name: "Yes, cancel booking" }).click();
    await expect(page).toHaveURL(`/booking/${token}?updated=cancelled`);
    await expect(page.getByText("Your booking has been cancelled")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reschedule" })).toBeHidden();
    await openLoggedEmail(adminPage, email, /^Cancelled: Free AI Strategy Call/);

    // Admin: no longer upcoming; listed under cancelled with the reason on the contact's timeline.
    await adminPage.goto("/admin/bookings");
    await expect(adminPage.getByRole("link", { name })).toBeHidden();
    await adminPage.getByRole("navigation", { name: "Booking lists" }).getByRole("link", { name: /Cancelled/ }).click();
    const cancelledRow = adminPage.getByRole("listitem").filter({ has: adminPage.getByRole("link", { name }) });
    await expect(cancelledRow).toBeVisible();
    await expect(cancelledRow).toContainText(/Cancelled/);
  });
});
