import { describe, expect, it } from "vitest";
import { fillTemplate } from "@/lib/email";
import { firstName, formatMoney, safeRedirectPath, slugify } from "@/lib/utils";
import { getDb, schema } from "@/db";

describe("utils", () => {
  it("formats money from cents", () => {
    expect(formatMoney(4700)).toBe("$47");
    expect(formatMoney(4750)).toBe("$47.50");
  });
  it("blocks open redirects", () => {
    expect(safeRedirectPath("//evil.com", "/")).toBe("/");
    expect(safeRedirectPath("https://evil.com", "/")).toBe("/");
    expect(safeRedirectPath("/\\evil.com", "/")).toBe("/");
    expect(safeRedirectPath("/learn/x", "/")).toBe("/learn/x");
  });
  it("derives first names and slugs", () => {
    expect(firstName("ada lovelace")).toBe("Ada");
    expect(firstName(null, "sam@x.com")).toBe("sam");
    expect(slugify("Hello, AI World!")).toBe("hello-ai-world");
  });
  it("fills and escapes templates", () => {
    expect(fillTemplate("Hi {{firstName}} {{missing}}", { firstName: "<b>" }, true)).toBe("Hi &lt;b&gt; ");
  });
});

describe("database", () => {
  it("migrates and seeds the embedded database", async () => {
    const db = await getDb();
    const courses = await db.select().from(schema.courses);
    expect(courses.length).toBeGreaterThanOrEqual(3);
    const types = await db.select().from(schema.meetingTypes);
    expect(types.map((t) => t.slug)).toContain("ai-strategy-call");
  });
});
