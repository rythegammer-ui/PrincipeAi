import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { E2E_ADMIN } from "./env";
import { expect, loginAsAdmin, test, uniqueEmail } from "./helpers";

/** Creates a contact through Admin → Contacts → New contact and leaves the page on their profile. */
async function createContact(adminPage: Page, name: string, email: string) {
  await adminPage.goto("/admin/contacts");
  await adminPage.getByRole("link", { name: "New contact" }).click();
  await expect(adminPage.getByRole("heading", { level: 1, name: "New contact" })).toBeVisible();
  await adminPage.getByLabel("Full name").fill(name);
  await adminPage.getByLabel(/^Email/).fill(email);
  await adminPage.getByLabel("Company").fill("Northwind Traders");
  await adminPage.getByLabel("Interested in AI for").selectOption({ label: "Business" });
  await adminPage.getByLabel("Tags").fill("e2e, workshop");
  await adminPage.getByLabel("First note").fill("Met at the spring AI workshop.");
  await adminPage.getByRole("button", { name: "Create contact" }).click();
  await expect(adminPage).toHaveURL(/\/admin\/contacts\/[0-9a-f-]{36}$/);
  await expect(adminPage.getByRole("heading", { level: 1, name })).toBeVisible();
}

test.describe("admin dashboard", () => {
  test("sign in, see the dashboard KPIs, sign out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin/);

    // A wrong password is refused.
    await page.getByLabel("Email", { exact: true }).fill(E2E_ADMIN.email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Incorrect email or password." })).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);

    await loginAsAdmin(page);
    await expect(page).toHaveURL("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
    const kpis = page.getByRole("region", { name: "Key metrics" });
    for (const label of ["New leads", "Calls booked", "Revenue", "Open tasks"]) {
      await expect(kpis.getByText(label, { exact: true })).toBeVisible();
    }
    // The demo data gives every KPI a value.
    await expect(kpis.getByRole("link", { name: /^New leads \d+/ })).toBeVisible();
    await expect(kpis.getByRole("link", { name: /^Revenue \$[\d,]+/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

    // The 7-day range switch works.
    await page.getByRole("navigation", { name: "Date range" }).getByRole("link", { name: "7 days" }).click();
    await expect(page).toHaveURL("/admin?range=7");
    await expect(page.getByText(/last 7 days/i).first()).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/contacts");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fcontacts/);
  });

  test("contact detail: add a note and a task", async ({ adminPage }) => {
    const name = `Nora Notes ${Date.now().toString(36)}`;
    await createContact(adminPage, name, uniqueEmail("crm"));
    await expect(adminPage.getByText("Met at the spring AI workshop.").first()).toBeVisible();

    // Note on the timeline.
    const note = `Prefers a call on Thursdays (${Date.now().toString(36)})`;
    await adminPage.getByRole("textbox", { name: "Note", exact: true }).fill(note);
    await adminPage.getByRole("button", { name: "Add note" }).last().click();
    await expect(adminPage.getByText(note)).toBeVisible();
    await expect(adminPage.getByRole("textbox", { name: "Note", exact: true })).toHaveValue("");

    // Task with a priority.
    const task = `Send the workshop slides ${Date.now().toString(36)}`;
    await adminPage.getByRole("textbox", { name: /^Task/ }).fill(task);
    await adminPage.getByRole("combobox", { name: "Priority" }).selectOption({ label: "High" });
    await adminPage.getByRole("button", { name: "Add task" }).click();
    await expect(adminPage.getByText(task).first()).toBeVisible();

    // Both are stored (they survive a reload) and the task is on the Tasks board.
    await adminPage.reload();
    await expect(adminPage.getByText(note)).toBeVisible();
    await expect(adminPage.getByText(task).first()).toBeVisible();
    await adminPage.goto("/admin/tasks");
    await expect(adminPage.getByText(task).first()).toBeVisible();
  });

  test("pipeline: move a contact to another stage with the select", async ({ adminPage }) => {
    const name = `Pia Pipeline ${Date.now().toString(36)}`;
    const email = uniqueEmail("pipe");
    await createContact(adminPage, name, email);

    await adminPage.goto(`/admin/pipeline?q=${encodeURIComponent(email)}`);
    await expect(adminPage.getByRole("region", { name: "New Lead" }).getByRole("link", { name })).toBeVisible();
    await adminPage.getByRole("combobox", { name: `Move ${name} to stage` }).selectOption({ label: "Qualified" });
    await expect(adminPage.getByRole("region", { name: "Qualified" }).getByRole("link", { name })).toBeVisible();
    await expect(adminPage.getByRole("region", { name: "New Lead" }).getByRole("link", { name })).toBeHidden();

    // Saved: still there after a reload, and logged on the contact's timeline.
    await adminPage.reload();
    await expect(adminPage.getByRole("region", { name: "Qualified" }).getByRole("link", { name })).toBeVisible();
    await adminPage.getByRole("link", { name }).click();
    await expect(adminPage.getByRole("combobox", { name: "Pipeline stage" })).toHaveValue("qualified");
    await expect(adminPage.getByText("New Lead → Qualified").first()).toBeVisible();
  });

  test("email automations page lists the sequences", async ({ adminPage }) => {
    await adminPage.goto("/admin/sequences");
    await expect(adminPage.getByRole("heading", { level: 1, name: "Email Automations" })).toBeVisible();
    const table = adminPage.getByRole("table", { name: "Email automations" });
    for (const sequence of ["Free Guide Nurture", "Assessment Follow-up", "Call Prep", "New Student Onboarding"]) {
      await expect(table.getByRole("link", { name: sequence })).toBeVisible();
    }
    await table.getByRole("link", { name: "Free Guide Nurture" }).click();
    await expect(adminPage.getByRole("heading", { level: 1, name: /Free Guide Nurture/ })).toBeVisible();
  });

  test("settings save round-trip", async ({ adminPage }) => {
    const instructions = `Always mention the free assessment first. (${Date.now().toString(36)})`;
    await adminPage.goto("/admin/settings");
    const field = adminPage.getByRole("textbox", { name: "Extra instructions" });
    const before = await field.inputValue();
    await field.fill(instructions);
    await adminPage.getByRole("button", { name: "Save settings" }).click();
    await expect(adminPage.getByRole("status").filter({ hasText: "Settings saved." })).toBeVisible();

    await adminPage.reload();
    await expect(adminPage.getByRole("textbox", { name: "Extra instructions" })).toHaveValue(instructions);

    // Put it back.
    await adminPage.getByRole("textbox", { name: "Extra instructions" }).fill(before);
    await adminPage.getByRole("button", { name: "Save settings" }).click();
    await expect(adminPage.getByRole("status").filter({ hasText: "Settings saved." })).toBeVisible();
    await adminPage.reload();
    await expect(adminPage.getByRole("textbox", { name: "Extra instructions" })).toHaveValue(before);
  });

  test("run automations now", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings");
    const tools = adminPage.getByRole("region", { name: "Tools" });
    await tools.getByRole("button", { name: "Run automations now" }).click();
    const result = tools.getByRole("status").filter({ hasText: /finished/ });
    await expect(result).toContainText(/^All jobs finished in [\d.]+s/);
    await expect(result.getByRole("listitem")).not.toHaveCount(0);
    await expect(result).not.toContainText("Error:");
  });

  test("contacts CSV export downloads the filtered contacts", async ({ adminPage }) => {
    const name = `Eve Export ${Date.now().toString(36)}`;
    const email = uniqueEmail("export");
    await createContact(adminPage, name, email);

    await adminPage.goto(`/admin/contacts?q=${encodeURIComponent(email)}`);
    const downloadPromise = adminPage.waitForEvent("download");
    await adminPage.getByRole("link", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
    const csv = await readFile((await download.path())!, "utf8");
    const lines = csv.replace(/^﻿/, "").trim().split(/\r?\n/);
    expect(lines[0].toLowerCase()).toContain("email");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(email);
    expect(lines[1]).toContain(name);
  });
});
