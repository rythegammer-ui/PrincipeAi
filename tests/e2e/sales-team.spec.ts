import { expect, openLoggedEmail, openSignInLink, randomClientIp, signInAsStudent, test, uniqueEmail } from "./helpers";

const COURSE = { slug: "ai-essentials", title: "AI Essentials" };

test.describe("sales team", () => {
  test("apply → approved → agent signs in → a customer buys through their link → the sale is on their dashboard", async ({ page, adminPage, browser, baseURL }) => {
    const agentEmail = uniqueEmail("agent");

    // A candidate applies on the public page.
    await page.goto("/sales-team");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Required fields' labels end in "*".
    await page.getByLabel(/^Full name\*?$/).fill("Riley Agent");
    await page.getByLabel(/^Email\*?$/).fill(agentEmail);
    await page.getByLabel(/^Phone\*?$/).fill("512-555-0100");
    await page.getByLabel(/^City\*?$/).fill("Austin");
    await page.getByLabel(/^State\*?$/).selectOption("TX");
    await page.getByLabel("Some sales or customer-facing experience").check();
    await page.getByLabel(/^Time you can give it\*?$/).selectOption({ index: 2 });
    await page.getByLabel(/^How would you find customers\?\*?$/).fill("Small business owners I know from my local chamber of commerce.");
    await page.getByLabel(/I've read and agree to the/).check();
    await page.getByLabel(/18 or older/).check();
    await page.getByRole("button", { name: "Send my application" }).click();
    await expect(page.getByRole("heading", { name: /Thanks, Riley — application received/ })).toBeVisible();
    await openLoggedEmail(adminPage, agentEmail, "We got your application");

    // An admin approves it: the agent gets a referral code.
    await adminPage.goto("/admin/sales");
    const card = adminPage.getByRole("listitem").filter({ hasText: agentEmail });
    await card.getByRole("button", { name: "Approve" }).click();
    // The application leaves the queue and the agent appears in the team table with their code (first name + 2 digits).
    const agentRow = adminPage.getByRole("row").filter({ hasText: agentEmail });
    await expect(agentRow).toContainText(/RILEY\d{2}/);
    await expect(card).toHaveCount(0);
    const code = (await agentRow.textContent())!.match(/RILEY\d{2}/)![0];
    await openLoggedEmail(adminPage, agentEmail, "You're on the");

    // The agent signs in to their portal with an emailed link (shown on the page without an email provider).
    const agentContext = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
    const agent = await agentContext.newPage();
    await agent.goto("/agent");
    await expect(agent).toHaveURL(/\/agent\/login$/);
    await agent.getByLabel("Email address").fill(agentEmail);
    await agent.getByRole("button", { name: "Email me a sign-in link" }).click();
    const devLink = agent.getByRole("link", { name: "Sign in now" });
    await expect(devLink).toHaveAttribute("href", /&for=agent$/);
    await openSignInLink(agent, (await devLink.getAttribute("href"))!, "Continue to my dashboard");
    await expect(agent).toHaveURL(/\/agent$/);
    await expect(agent.getByRole("heading", { level: 1, name: "Welcome back, Riley" })).toBeVisible();
    await expect(agent.getByText(`/r/${code}`).first()).toBeVisible();

    // A customer follows the agent's link and buys a course.
    const customerContext = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
    const customer = await customerContext.newPage();
    const buyerEmail = uniqueEmail("referred");
    await customer.goto(`/r/${code}?to=/courses/${COURSE.slug}`);
    await expect(customer).toHaveURL(`/courses/${COURSE.slug}`);
    const buyBox = customer.getByRole("complementary", { name: "Enroll" });
    await buyBox.getByLabel("Your name").fill("Morgan Customer");
    await buyBox.getByLabel("Email").fill(buyerEmail);
    await buyBox.getByRole("button", { name: "Enroll now" }).click();
    await expect(customer).toHaveURL(/\/checkout\/test\//);
    await customer.getByRole("button", { name: /Complete test purchase/ }).click();
    await expect(customer.getByRole("heading", { name: "You're in! Welcome aboard." })).toBeVisible();

    // The agent is told, and the sale counts on their dashboard (commission pending the refund window).
    await openLoggedEmail(adminPage, agentEmail, "You made a sale!");
    await agent.reload();
    const numbers = agent.getByRole("list", { name: "Your numbers" });
    await expect(numbers.getByRole("listitem").filter({ hasText: "Sales this month" })).toContainText("1");
    await expect(numbers.getByRole("listitem").filter({ hasText: "Customers" })).toContainText("1");
    await expect(numbers.getByRole("listitem").filter({ hasText: "Pending" })).not.toContainText("$0");
    // Agents never see who bought.
    await expect(agent.getByText(buyerEmail)).toHaveCount(0);
    await expect(agent.getByText("Morgan Customer")).toHaveCount(0);

    // The admin sees who sold it.
    await adminPage.goto("/admin/orders");
    await expect(adminPage.getByRole("row").filter({ hasText: buyerEmail })).toContainText("Riley Agent");

    await agentContext.close();
    await customerContext.close();
  });

  test("an admin adds a team member, who signs in with a one-time link and is signed out when removed", async ({ adminPage, browser, baseURL }) => {
    const memberEmail = uniqueEmail("teammate");

    await adminPage.goto("/admin/team");
    await adminPage.getByLabel(/^Email\*?$/).fill(memberEmail);
    await adminPage.getByLabel(/^Name\*?$/).fill("Avery Teammate");
    await adminPage.getByRole("button", { name: "Add to the team" }).click();
    const row = adminPage.getByRole("listitem").filter({ hasText: memberEmail });
    await expect(row).toBeVisible();
    await openLoggedEmail(adminPage, memberEmail, "admin team");

    // The deployed site never shows a team member's sign-in link on the login page; the owner can create one.
    await adminPage.goto("/admin/team");
    await row.getByRole("button", { name: /Create sign-in link/ }).click();
    const link = (await row.getByRole("status").locator(".font-mono").textContent())!.trim();
    expect(link).toMatch(/\/auth\/verify\?token=.+&for=admin$/);

    const memberContext = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
    const member = await memberContext.newPage();
    await member.goto("/admin/login?method=link");
    await member.getByLabel("Your email").fill(memberEmail);
    await member.getByRole("button", { name: "Email me a sign-in link" }).click();
    await expect(member.getByText(/is on the admin team, a sign-in link is on its way/)).toBeVisible();
    await expect(member.getByRole("link", { name: "Sign in now" })).toHaveCount(0);

    await openSignInLink(member, link, "Continue to the dashboard");
    await expect(member).toHaveURL(/\/admin$/);
    await member.goto("/admin/contacts");
    await expect(member.getByRole("heading", { level: 1, name: "Contacts" })).toBeVisible();
    // A one-time link works once.
    await openSignInLink(member, link, "Continue to the dashboard");
    await expect(member.getByText(/invalid or has expired/)).toBeVisible();

    // Removed: signed out on their very next page.
    await adminPage.goto("/admin/team");
    await row.getByRole("button", { name: "Remove" }).click();
    await row.getByRole("button", { name: "Remove and sign out" }).click();
    await expect(adminPage.getByRole("listitem").filter({ hasText: memberEmail })).toHaveCount(0);
    await member.goto("/admin/contacts");
    await expect(member).toHaveURL(/\/admin\/login/);

    await memberContext.close();
  });

  test("agent pages need an agent: signed-out visitors and students who aren't agents are turned away", async ({ page }) => {
    await page.goto("/agent/toolkit");
    await expect(page).toHaveURL(/\/agent\/login$/);

    // A student (signed in, but not on the sales team) sees no agent data, and no sign-in link is sent to them.
    await signInAsStudent(page, uniqueEmail("student-not-agent"), "/learn");
    await expect(page).toHaveURL(/\/learn/);
    await page.goto("/agent");
    await expect(page.getByRole("heading", { level: 1, name: /sales team/i })).toBeVisible();
    await expect(page.getByRole("list", { name: "Your numbers" })).toHaveCount(0);
    await page.goto("/agent/toolkit");
    await expect(page.getByText(/\/r\/[A-Z0-9]{4,16}/)).toHaveCount(0);
  });
});
