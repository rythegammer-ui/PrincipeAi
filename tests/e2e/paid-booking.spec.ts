import type { Page } from "@playwright/test";
import { expect, openContact, openLoggedEmail, pickFirstAvailableTime, test, uniqueEmail } from "./helpers";

const SESSION = { slug: "ai-coaching-session", name: "1:1 AI Coaching Session", price: "$150" };

/**
 * From /book: picks the paid session's first open time, fills in the form and continues to the built-in test
 * checkout (no Stripe key), which holds the time while it's open.
 */
async function holdPaidSession(page: Page, who: { name: string; email: string }): Promise<void> {
  await page.goto("/book");
  await page.getByRole("link", { name: new RegExp(SESSION.name) }).first().click();
  await expect(page).toHaveURL(`/book/${SESSION.slug}`);
  await expect(page.getByRole("heading", { level: 1, name: SESSION.name })).toBeVisible();

  const time = await pickFirstAvailableTime(page.getByRole("main"));
  await expect(page.getByRole("heading", { name: "Tell us a little about you" })).toBeVisible();
  await expect(page.getByRole("main").getByText(time).first()).toBeVisible();
  await page.getByLabel("Your name").fill(who.name);
  await page.getByLabel("Email").fill(who.email);
  await page.getByLabel("What would you like to work on together?").fill("Build a prompt library for our support team.");
  await page.getByRole("button", { name: `Continue to payment · ${SESSION.price}` }).click();

  await expect(page).toHaveURL(/\/checkout\/test\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: "Checkout" })).toBeVisible();
  await expect(page.getByText(SESSION.name).first()).toBeVisible();
  await expect(page.getByText(`${who.name} · ${who.email}`)).toBeVisible();
}

/** The admin Bookings list item of this invitee (Upcoming tab). */
async function adminBookingRow(adminPage: Page, name: string) {
  await adminPage.goto("/admin/bookings");
  const row = adminPage.getByRole("listitem").filter({ has: adminPage.getByRole("link", { name }) });
  await expect(row).toBeVisible();
  await expect(row).toContainText(SESSION.name);
  return row;
}

/** This buyer's rows in Admin → Orders (paid sessions only). */
async function adminOrderRows(adminPage: Page, email: string) {
  await adminPage.goto("/admin/orders?type=booking");
  await expect(adminPage.getByRole("heading", { level: 1, name: "Orders" })).toBeVisible();
  return adminPage.getByRole("row").filter({ hasText: email });
}

test.describe("booking a paid coaching session", () => {
  test("book → test checkout → success → confirmed, with the order in Admin → Orders", async ({ page, adminPage }) => {
    const email = uniqueEmail("coach");
    const name = `Paige Payer ${Date.now().toString(36)}`;

    await holdPaidSession(page, { name, email });
    await page.getByRole("button", { name: `Complete test purchase · ${SESSION.price}` }).click();

    // Success page: the session is confirmed.
    await expect(page).toHaveURL(/\/checkout\/success\?order=[0-9a-f-]{36}&session_id=test_/);
    await expect(page.getByRole("heading", { level: 1, name: "Your session is confirmed" })).toBeVisible();
    await expect(page.getByText("test mode — no real payment was taken", { exact: false })).toBeVisible();
    await expect(page.getByText(email).first()).toBeVisible();
    await page.getByRole("link", { name: "Manage your booking" }).click();
    await expect(page).toHaveURL(/\/booking\/[0-9a-f]{32}$/);
    const token = page.url().match(/booking\/([0-9a-f]{32})/)![1];
    await expect(page.getByRole("heading", { level: 1, name: "Manage your booking" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reschedule" })).toBeVisible();
    await expect(page.getByText("Waiting for payment")).toBeHidden();

    // Email Log: the confirmation (with the manage link) and the receipt.
    const confirmation = await openLoggedEmail(adminPage, email, new RegExp(`^Confirmed: ${SESSION.name}`));
    await expect(confirmation.getByRole("link", { name: /reschedule|cancel|manage/i }).first()).toHaveAttribute("href", new RegExp(`/booking/${token}$`));
    const receipt = await openLoggedEmail(adminPage, email, /^Your receipt from /);
    await expect(receipt.getByRole("cell", { name: SESSION.price, exact: true })).toBeVisible();
    await expect(receipt.getByText(/Your session is confirmed/)).toBeVisible();
    await expect(receipt.getByText(/test purchase/)).toBeVisible();

    // Admin → Bookings: upcoming and confirmed. Admin → Orders: paid (test). CRM: a customer now.
    const row = await adminBookingRow(adminPage, name);
    await expect(row).toContainText("Confirmed");
    await expect(row).toContainText(SESSION.price);
    const orders = await adminOrderRows(adminPage, email);
    await expect(orders).toHaveCount(1);
    await expect(orders).toContainText(SESSION.name);
    await expect(orders).toContainText("Paid session");
    await expect(orders).toContainText(SESSION.price);
    await expect(orders.getByText("Paid", { exact: true })).toBeVisible();
    await expect(orders.getByText("Test", { exact: true })).toBeVisible();
    await expect(orders.getByText("Session cancelled")).toBeHidden();
    await openContact(adminPage, email);
    await expect(adminPage.getByRole("combobox", { name: "Pipeline stage" })).toHaveValue("customer");

    // The invitee cancels: they're told how to get a refund, and Orders flags the paid order for the owner.
    await page.getByRole("button", { name: "Cancel booking" }).click();
    const cancel = page.getByRole("region", { name: "Cancel this booking?" });
    await cancel.getByRole("button", { name: "Yes, cancel booking" }).click();
    await expect(page).toHaveURL(`/booking/${token}?updated=cancelled`);
    await expect(page.getByText("Your booking has been cancelled")).toBeVisible();
    await expect(page.getByText(`If you'd like a refund of ${SESSION.price}`)).toBeVisible();
    const cancelled = await adminOrderRows(adminPage, email);
    await expect(cancelled.getByText("Paid", { exact: true })).toBeVisible();
    await expect(cancelled.getByText("Session cancelled")).toBeVisible();
  });

  test("cancelling the test checkout keeps the hold, and the manage page offers to complete payment", async ({ page, adminPage }) => {
    const email = uniqueEmail("coach-held");
    const name = `Hal Holder ${Date.now().toString(36)}`;

    await holdPaidSession(page, { name, email });
    await page.getByRole("link", { name: "Cancel and go back" }).click();

    // Nothing was charged and the time is still held.
    await expect(page).toHaveURL(/\/checkout\/cancelled\?order=[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1, name: "No problem — you haven't been charged" })).toBeVisible();
    await expect(page.getByText(/still holding your time/)).toBeVisible();
    await page.getByRole("link", { name: "Back to your booking" }).click();

    // Manage page: waiting for payment, with the way to pay or pick another time.
    await expect(page).toHaveURL(/\/booking\/[0-9a-f]{32}$/);
    await expect(page.getByText("Waiting for payment")).toBeVisible();
    await expect(page.getByText(/This time is held for you until /)).toBeVisible();
    const pay = page.getByRole("button", { name: `Complete payment (${SESSION.price})` });
    await expect(pay).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose a different time" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reschedule" })).toBeHidden();

    // Admin: the held booking is upcoming and awaiting payment; its checkout is pending.
    await expect(await adminBookingRow(adminPage, name)).toContainText("Awaiting payment");
    const pending = await adminOrderRows(adminPage, email);
    await expect(pending).toHaveCount(1);
    await expect(pending.getByText("Pending", { exact: true })).toBeVisible();

    // Completing payment from the manage page opens a fresh checkout and confirms the booking.
    await pay.click();
    await expect(page).toHaveURL(/\/checkout\/test\/[0-9a-f-]{36}$/);
    await page.getByRole("button", { name: `Complete test purchase · ${SESSION.price}` }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Your session is confirmed" })).toBeVisible();
    await openLoggedEmail(adminPage, email, new RegExp(`^Confirmed: ${SESSION.name}`));
    await expect(await adminBookingRow(adminPage, name)).toContainText("Confirmed");
    // The abandoned first checkout was closed, so the booking can't be paid twice.
    const orders = await adminOrderRows(adminPage, email);
    await expect(orders).toHaveCount(2);
    await expect(orders.getByText("Paid", { exact: true })).toHaveCount(1);
    await expect(orders.getByText("Expired", { exact: true })).toHaveCount(1);
  });
});
