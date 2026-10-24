import type { Browser, Page } from "@playwright/test";
import { expect, openLoggedEmail, openSignInLink, randomClientIp, signInAsStudent, test, uniqueEmail } from "./helpers";

const COURSE = { slug: "ai-essentials", title: "AI Essentials" };

/** Applies on /sales-team, gets approved by the admin and signs in to the agent portal in its own browser. */
async function newSignedInAgent(browser: Browser, baseURL: string | undefined, adminPage: Page, firstName: string) {
  const email = uniqueEmail(`agent-${firstName.toLowerCase()}`);
  const context = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
  const agent = await context.newPage();
  await agent.goto("/sales-team");
  await agent.getByLabel(/^Full name\*?$/).fill(`${firstName} Agent`);
  await agent.getByLabel(/^Email\*?$/).fill(email);
  await agent.getByLabel(/^Phone\*?$/).fill("512-555-0100");
  await agent.getByLabel(/^City\*?$/).fill("Austin");
  await agent.getByLabel(/^State\*?$/).selectOption("TX");
  await agent.getByLabel("Some sales or customer-facing experience").check();
  await agent.getByLabel(/^Time you can give it\*?$/).selectOption({ index: 2 });
  await agent.getByLabel(/^How would you find customers\?\*?$/).fill("Local businesses in my neighborhood.");
  await agent.getByLabel(/I've read and agree to the/).check();
  await agent.getByLabel(/18 or older/).check();
  await agent.getByRole("button", { name: "Send my application" }).click();
  await expect(agent.getByRole("heading", { name: /application received/ })).toBeVisible();

  await adminPage.goto("/admin/sales");
  await adminPage.getByRole("listitem").filter({ hasText: email }).getByRole("button", { name: "Approve" }).click();
  const row = adminPage.getByRole("row").filter({ hasText: email });
  const pattern = new RegExp(`${firstName.toUpperCase()}\\d{2}`);
  await expect(row).toContainText(pattern);
  const code = (await row.textContent())!.match(pattern)![0];

  await agent.goto("/agent/login");
  await agent.getByLabel("Email address").fill(email);
  await agent.getByRole("button", { name: "Email me a sign-in link" }).click();
  const devLink = agent.getByRole("link", { name: "Sign in now" });
  await openSignInLink(agent, (await devLink.getAttribute("href"))!, "Continue to my dashboard");
  await expect(agent).toHaveURL(/\/agent$/);
  return { agent, context, code, email };
}

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

  test("an agent adds a business, writes a first message and tracks it; a visitor who agrees becomes a warm lead", async ({ adminPage, browser, baseURL }) => {
    const { agent, context, code } = await newSignedInAgent(browser, baseURL, adminPage, "Quinn");
    const business = `Maple Street Dental ${Date.now().toString(36)}`;

    await agent.getByRole("navigation").getByRole("link", { name: "Leads" }).first().click();
    await expect(agent.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible();
    // No Google key in this run: search is off, adding by hand still works.
    await expect(agent.getByText("Business search isn't switched on yet")).toBeVisible();
    // With search off, the add-by-hand form starts open.
    await expect(agent.locator("details").filter({ has: agent.locator("summary", { hasText: "Add a business you found yourself" }) })).toHaveAttribute("open", "");
    const addForm = agent.locator("form").filter({ has: agent.getByRole("button", { name: "Add business" }) });
    await addForm.getByLabel(/^Business name\*?$/).fill(business);
    await addForm.getByLabel("Kind of business").fill("Dental practice");
    await addForm.getByLabel("Website").fill(`maple-${Date.now().toString(36)}.example.com`);
    await addForm.getByRole("button", { name: "Add business" }).click();
    await expect(agent).toHaveURL(/\/agent\/leads\/[0-9a-f-]{36}$/);
    await expect(agent.getByRole("heading", { level: 1, name: business })).toBeVisible();

    // Its tracked link opens the assessment.
    const link = (await agent.locator("code").filter({ hasText: `/r/${code}` }).textContent())!.trim();
    expect(link).toMatch(new RegExp(`/r/${code}\\?to=%2Fassessment&p=[A-Za-z0-9_-]{12}$`));

    // A first email (the built-in template: no AI key), with the parts the rules need.
    await agent.getByRole("button", { name: "Write my message" }).click();
    const message = agent.getByRole("region", { name: "Your message" });
    await expect(message).toContainText(link);
    await expect(message).toContainText("Full disclosure: I'm an independent sales agent");
    await expect(message).toContainText('Reply "stop"');
    await expect(message).toContainText("Quinn");
    // The channel picker keeps its choice after a message is written.
    await agent.getByLabel("How you'll reach out").selectOption("message");
    await agent.getByRole("button", { name: "Write another version" }).click();
    await expect(message).not.toContainText('Reply "stop"');
    await expect(agent.getByLabel("How you'll reach out")).toHaveValue("message");
    await agent.getByRole("button", { name: /I sent it: mark as contacted/ }).click();
    await expect(agent.getByText(/Marked as sent\. We'll remind you to follow up on/)).toBeVisible();

    // A saved status stays selected, so the next save doesn't quietly put the old one back.
    await agent.getByLabel("Status", { exact: true }).selectOption("replied");
    await agent.getByLabel("Notes").fill("Spoke with the office manager.");
    await agent.getByRole("button", { name: "Save changes" }).click();
    await expect(agent.getByText("Saved.")).toBeVisible();
    await expect(agent.getByLabel("Status", { exact: true })).toHaveValue("replied");
    await agent.reload();
    await expect(agent.getByLabel("Status", { exact: true })).toHaveValue("replied");
    await expect(agent.getByLabel("Notes")).toHaveValue("Spoke with the office manager.");

    // A visitor follows the business's link, then gets the free kit and says the agent may follow up.
    const visitorContext = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
    const visitor = await visitorContext.newPage();
    const visitorEmail = uniqueEmail("warm");
    await visitor.goto(new URL(link).pathname + new URL(link).search);
    await expect(visitor).toHaveURL(/\/assessment$/);
    await visitor.goto("/free-guide");
    const form = visitor.locator("form").filter({ has: visitor.getByRole("button", { name: /Send me the free kit/ }) }).first();
    await form.getByLabel("First name").fill("Dana");
    await form.getByRole("textbox", { name: /^Email/ }).fill(visitorEmail);
    await form.getByText("My business", { exact: true }).click();
    const consent = form.getByLabel(/OK for Quinn, the independent sales agent/);
    await expect(consent).not.toBeChecked();
    await consent.check();
    await form.getByRole("button", { name: /Send me the free kit/ }).click();
    await expect(visitor.getByRole("heading", { level: 1, name: /Your kit is ready/ })).toBeVisible();

    await agent.goto("/agent/leads");
    const row = agent.getByRole("row").filter({ hasText: business });
    await expect(row).toContainText("Replied");
    await expect(row).toContainText("Signed up");
    await expect(agent.getByRole("row").filter({ hasText: visitorEmail })).toContainText("AI Starter Kit");

    // The admin sees who's working which business.
    await adminPage.goto("/admin/sales/prospects");
    await expect(adminPage.getByRole("row").filter({ hasText: business })).toContainText("Quinn Agent");

    // Visitors who didn't come through an agent's link never see the box.
    const plainContext = await browser.newContext({ baseURL, extraHTTPHeaders: { "x-forwarded-for": randomClientIp() } });
    const plain = await plainContext.newPage();
    await plain.goto("/free-guide");
    await expect(plain.getByText(/independent sales agent who shared this link/)).toHaveCount(0);

    await plainContext.close();
    await visitorContext.close();
    await context.close();
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
