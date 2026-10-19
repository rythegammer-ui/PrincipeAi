import { expect, openLoggedEmail, pickFirstAvailableTime, test, uniqueEmail } from "./helpers";

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

test.describe("booking the implementation discovery call", () => {
  test("a consulting application prefills the booking form once", async ({ page, adminPage }) => {
    const email = uniqueEmail("apply");
    const goals = `Answer common customer questions on our website and book appointments (${Date.now().toString(36)}).`;

    await page.goto("/consulting");
    const application = page.locator("form").filter({ has: page.getByLabel("Work email") });
    await application.getByLabel("Your name").fill("Carl Consult");
    await application.getByLabel("Work email").fill(email);
    await application.getByLabel("Company").fill("Consult Co");
    await application.getByLabel("Website").fill("consultco.example.com");
    await application.getByLabel("Team size").selectOption({ label: "2–10 people" });
    await application.getByLabel("Ideal timeline").selectOption({ label: "In the next 1–3 months" });
    await application.getByLabel("What would you like AI to automate or build?").fill(goals);
    await application.getByLabel("Budget range for this project").selectOption({ label: "$5,000 – $15,000" });
    await application.getByRole("button", { name: "Continue to pick a call time" }).click();

    // The booking form carries the application's answers.
    await expect(page).toHaveURL(/\/book\/implementation-discovery\?/);
    const main = page.getByRole("main");
    await pickFirstAvailableTime(main);
    await expect(page.getByLabel("Your name")).toHaveValue("Carl Consult");
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await expect(page.getByLabel("Company name and website")).toHaveValue("Consult Co · https://consultco.example.com");
    await expect(page.getByLabel("What would you like to automate or build with AI?")).toHaveValue(goals);
    await expect(page.getByLabel("Rough budget range")).toHaveValue("$5,000 – $15,000");
    await page.getByRole("button", { name: "Confirm booking" }).click();
    await expect(page).toHaveURL(/\/book\/confirmed\/[0-9a-f]{32}/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/You.re booked, Carl!/);

    // Admin → Bookings shows the answers with the booking.
    await adminPage.goto("/admin/bookings");
    const row = adminPage.getByRole("listitem").filter({ hasText: email });
    await expect(row).toContainText("AI Implementation Discovery Call");
    await row.getByText(/^Intake answers/).click();
    await expect(row.getByText(goals)).toBeVisible();

    // The answers are used once: the next discovery booking from this browser starts blank.
    await page.goto("/book/implementation-discovery");
    await pickFirstAvailableTime(main);
    await expect(page.getByLabel("Company name and website")).toHaveValue("");
    await expect(page.getByLabel("What would you like to automate or build with AI?")).toHaveValue("");
  });
});
