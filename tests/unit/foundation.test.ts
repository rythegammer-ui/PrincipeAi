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
  it("reduces visitor-supplied names to plain greeting text", () => {
    expect(firstName("[Reset-your-password](https://evil.example/reset)")).toBe("Reset-your-password");
    expect(firstName("https://evil.example")).toBe("Https");
    expect(firstName("<img src=x>")).toBe("Img");
    expect(firstName("José García")).toBe("José");
    expect(firstName("o'brien")).toBe("O'brien");
    expect(firstName("Anne-Marie Smith")).toBe("Anne-Marie");
    expect(firstName("J.R. Tolkien")).toBe("JR");
    expect(firstName("x".repeat(200))).toHaveLength(40);
    expect(firstName("[](!!)", "sam.smith+news@x.com")).toBe("sam");
    expect(firstName("123", "99@x.com")).toBe("there");
    expect(firstName("", "")).toBe("there");
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

describe("Markdown (untrusted)", () => {
  it("drops remote images and unlinks off-site URLs, keeping site links", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { Markdown, isSiteLink } = await import("@/components/ui/markdown");
    const { site } = await import("@/config/site");
    const coursesUrl = new URL("/courses", site.url).href;
    const md =
      "![status](https://attacker.example/pixel.png?d=x) [Re-authenticate](https://attacker.example/login) " +
      `[Book a call](/book) https://evil.example/x [Courses](${coursesUrl})`;
    const trusted = renderToStaticMarkup(createElement(Markdown, { children: md }));
    expect(trusted).toContain('<img src="https://attacker.example/pixel.png?d=x"');
    expect(trusted).not.toContain("node=");

    const html = renderToStaticMarkup(createElement(Markdown, { untrusted: true, children: md }));
    expect(html).not.toContain("<img");
    expect(html).not.toContain('href="https://attacker.example');
    expect(html).not.toContain('href="https://evil.example');
    expect(html).toContain("[status]");
    expect(html).toContain("Re-authenticate (https://attacker.example/login)");
    expect(html).toContain('<a href="/book">Book a call</a>');
    expect(html).toContain(`href="${coursesUrl}"`);

    expect(isSiteLink("/learn")).toBe(true);
    expect(isSiteLink("#faq")).toBe(true);
    expect(isSiteLink("//evil.example/x")).toBe(false);
    expect(isSiteLink("mailto:a@b.co")).toBe(false);
    expect(isSiteLink("javascript:alert(1)")).toBe(false);
  });
});
