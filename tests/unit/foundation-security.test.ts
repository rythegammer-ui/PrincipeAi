import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { eq, like } from "drizzle-orm";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// next/headers outside a request: an in-memory cookie jar and a settable client IP.
const mocks = vi.hoisted(() => ({ jar: new Map<string, string>(), ip: { value: "203.0.113.1" } }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (mocks.jar.has(name) ? { name, value: mocks.jar.get(name) } : undefined),
    set: (name: string, value: string) => void mocks.jar.set(name, value),
    delete: (name: string) => void mocks.jar.delete(name),
  }),
  headers: async () => new Headers({ "x-forwarded-for": mocks.ip.value }),
}));

import { getDb, schema } from "@/db";
import { ADMIN_COOKIE, startAdminSession, startStudentSession, STUDENT_COOKIE, verifySession } from "@/lib/auth";
import { hasRedactedSignInLink, redactSignInLinks, sendEmail } from "@/lib/email";
import { ipRateLimitKey } from "@/lib/rate-limit";
import { adminCredentials, authSecret, dbMode, isDemoMode, missingDatabaseError } from "@/lib/runtime-mode";
import { safeRedirectPath } from "@/lib/utils";
import { proxy } from "@/proxy";

const CLEARED = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "VERCEL",
  "VERCEL_ENV",
  "DEMO_MODE",
  "AUTH_SECRET",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_SESSION_VERSION",
  "RESEND_API_KEY",
  "STRIPE_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
];

beforeEach(() => {
  for (const name of CLEARED) vi.stubEnv(name, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
});

const LONG_SECRET = "a-long-random-auth-secret-0123456789";
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe("runtime mode", () => {
  it("never turns a Vercel deployment without a database into a demo unless DEMO_MODE=1", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PGLITE_DIR", "");
    vi.stubEnv("VERCEL", "1");
    expect(dbMode()).toBe("pglite-file");
    expect(isDemoMode()).toBe(false);
    expect(missingDatabaseError()).toMatch(/DATABASE_URL.*DEMO_MODE=1/);
    expect(adminCredentials()).toBeNull();
    expect(() => authSecret()).toThrow(/AUTH_SECRET/);

    vi.stubEnv("DEMO_MODE", "1");
    expect(dbMode()).toBe("pglite-memory");
    expect(isDemoMode()).toBe(true);
    expect(missingDatabaseError()).toBeNull();

    vi.stubEnv("DATABASE_URL", "postgres://u:p@db.example/app");
    expect(dbMode()).toBe("postgres");
    expect(missingDatabaseError()).toBeNull();

    // Off Vercel (local `next start`, tests) the embedded file database is still allowed.
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("VERCEL", "");
    expect(missingDatabaseError()).toBeNull();
  });

  it("keeps the local file database in `next dev` after `vercel env pull` (VERCEL=1 in .env.local)", () => {
    vi.stubEnv("PGLITE_DIR", "");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("NODE_ENV", "development");
    expect(dbMode()).toBe("pglite-file");
    expect(missingDatabaseError()).toBeNull();
    // A local production build run with the pulled variables (VERCEL_ENV=development) isn't a deployment either.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "development");
    expect(missingDatabaseError()).toBeNull();
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(missingDatabaseError()).toMatch(/DATABASE_URL/);
  });

  it("uses the public demo signing key only while the dashboard is on the public demo login", () => {
    vi.stubEnv("NODE_ENV", "production"); // PGLITE_DIR=memory:// (vitest config) → demo mode
    expect(isDemoMode()).toBe(true);
    expect(adminCredentials()).toMatchObject({ password: "demo1234", isDefault: true });
    const demoKey = decode(authSecret());
    expect(demoKey).toContain("demo");

    // The owner locked the dashboard: the public key must stop working, and login needs AUTH_SECRET.
    vi.stubEnv("ADMIN_PASSWORD", "a-long-owner-password");
    expect(() => authSecret()).toThrow(/AUTH_SECRET/);
    expect(adminCredentials()).toBeNull();
    vi.stubEnv("AUTH_SECRET", LONG_SECRET);
    expect(decode(authSecret())).toBe(LONG_SECRET);
    expect(adminCredentials()).toMatchObject({ password: "a-long-owner-password", isDefault: false });

    // A too-short AUTH_SECRET is rejected, never replaced by the constant.
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("AUTH_SECRET", "short");
    expect(() => authSecret()).toThrow(/at least 16/);
    expect(adminCredentials()).toBeNull();
  });

  it("withholds the demo login while live keys are configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const key of ["RESEND_API_KEY", "STRIPE_SECRET_KEY", "ANTHROPIC_API_KEY"]) {
      vi.stubEnv(key, "live-key");
      expect(adminCredentials()).toBeNull();
      expect(() => authSecret()).toThrow(/AUTH_SECRET/);
      vi.stubEnv(key, "");
    }
    expect(adminCredentials()?.isDefault).toBe(true);
  });

  it("requires a 12+ character admin password and a 16+ character AUTH_SECRET in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "postgres://u:p@db.example/app");
    vi.stubEnv("ADMIN_EMAIL", " Owner@Example.com ");
    vi.stubEnv("ADMIN_PASSWORD", "short-pass1");
    vi.stubEnv("AUTH_SECRET", LONG_SECRET);
    expect(adminCredentials()).toBeNull();
    vi.stubEnv("ADMIN_PASSWORD", "long-enough-pw");
    expect(adminCredentials()).toEqual({ email: "owner@example.com", password: "long-enough-pw", isDefault: false });
    vi.stubEnv("AUTH_SECRET", "");
    expect(adminCredentials()).toBeNull();
    expect(() => authSecret()).toThrow(/AUTH_SECRET/);
  });
});

describe("admin sessions", () => {
  it("are revoked by changing the admin password or ADMIN_SESSION_VERSION, without touching students", async () => {
    mocks.jar.clear();
    await startAdminSession("admin@principe.ai");
    const token = mocks.jar.get(ADMIN_COOKIE);
    expect(await verifySession(token, "admin")).toMatchObject({ role: "admin", email: "admin@principe.ai" });

    await startStudentSession({ id: "4f7c8f5e-0000-4000-8000-000000000001", email: "student@example.com" });
    const studentToken = mocks.jar.get(STUDENT_COOKIE);

    vi.stubEnv("ADMIN_SESSION_VERSION", "2");
    expect(await verifySession(token, "admin")).toBeNull();
    expect(await verifySession(studentToken, "student")).not.toBeNull();
    vi.stubEnv("ADMIN_SESSION_VERSION", "");
    expect(await verifySession(token, "admin")).not.toBeNull();

    vi.stubEnv("ADMIN_PASSWORD", "a-brand-new-password");
    expect(await verifySession(token, "admin")).toBeNull();
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("ADMIN_EMAIL", "someone-else@example.com");
    expect(await verifySession(token, "admin")).toBeNull();
  });

  it("rejects validly signed admin tokens that carry no credential version", async () => {
    const legacy = await new SignJWT({ role: "admin", email: "admin@principe.ai" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(authSecret());
    expect(await verifySession(legacy, "admin")).toBeNull();
  });

  it("alerts the owner once when failed sign-ins pile up across many addresses", async () => {
    const { adminLoginAction } = await import("@/app/admin/login/actions");
    const attempt = (i: number) => {
      mocks.ip.value = `198.51.100.${i}`;
      const form = new FormData();
      form.set("email", "admin@principe.ai");
      form.set("password", `wrong-${i}`);
      form.set("next", "/admin");
      return adminLoginAction({}, form);
    };
    for (let i = 1; i <= 32; i++) expect(await attempt(i)).toEqual({ error: "Incorrect email or password." });
    const db = await getDb();
    const alerts = await db.select().from(schema.emailLog).where(like(schema.emailLog.subject, "%Repeated failed admin sign-ins%"));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].kind).toBe("notification");
  });
});

/** A client-side (RSC) navigation to an admin page with the (panel) layout already mounted: it skips the layout. */
function adminNavigation(pathname: string, adminCookie?: string): NextRequest {
  const tree = ["", { children: ["admin", { children: ["(panel)", { children: ["__PAGE__", {}] }] }] }, null, null];
  const headers = new Headers({ RSC: "1", "Next-Router-State-Tree": encodeURIComponent(JSON.stringify(tree)) });
  if (adminCookie) headers.set("cookie", `${ADMIN_COOKIE}=${adminCookie}`);
  return new NextRequest(`http://localhost:3000${pathname}`, { headers });
}

const passedThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";
const toLogin = (res: Response) => res.status === 307 && new URL(res.headers.get("location") ?? "", "http://x").pathname === "/admin/login";

describe("proxy auth gate", () => {
  it("applies admin revocation to in-app navigations, which skip the panel layout's check", async () => {
    mocks.jar.clear();
    await startAdminSession("admin@principe.ai");
    const token = mocks.jar.get(ADMIN_COOKIE)!;
    expect(passedThrough(await proxy(adminNavigation("/admin/contacts", token)))).toBe(true);
    expect(toLogin(await proxy(adminNavigation("/admin/contacts")))).toBe(true);

    // Revoked by ADMIN_SESSION_VERSION, by a new password, or by a new admin email.
    vi.stubEnv("ADMIN_SESSION_VERSION", "2");
    expect(toLogin(await proxy(adminNavigation("/admin/contacts", token)))).toBe(true);
    vi.stubEnv("ADMIN_SESSION_VERSION", "");
    vi.stubEnv("ADMIN_PASSWORD", "a-brand-new-password");
    expect(toLogin(await proxy(adminNavigation("/admin/emails", token)))).toBe(true);
    vi.stubEnv("ADMIN_PASSWORD", "");
    vi.stubEnv("ADMIN_EMAIL", "someone-else@example.com");
    expect(toLogin(await proxy(adminNavigation("/admin/settings", token)))).toBe(true);
    vi.stubEnv("ADMIN_EMAIL", "");
    expect(passedThrough(await proxy(adminNavigation("/admin/settings", token)))).toBe(true);
  });

  it("refuses validly signed admin cookies from before credential versions (no `cv` claim) and student cookies", async () => {
    const legacy = await new SignJWT({ role: "admin", email: "admin@principe.ai" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("admin")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(authSecret());
    expect(toLogin(await proxy(adminNavigation("/admin/contacts", legacy)))).toBe(true);

    await startStudentSession({ id: "4f7c8f5e-0000-4000-8000-000000000002", email: "student@example.com" });
    const student = mocks.jar.get(STUDENT_COOKIE)!;
    expect(toLogin(await proxy(adminNavigation("/admin/contacts", student)))).toBe(true);
    const learn = new NextRequest("http://localhost:3000/learn", { headers: { cookie: `${STUDENT_COOKIE}=${student}` } });
    expect(passedThrough(await proxy(learn))).toBe(true);
  });
});

describe("admin pages", () => {
  const panel = path.resolve(import.meta.dirname, "../../src/app/admin/(panel)");
  const pages = (readdirSync(panel, { recursive: true }) as string[]).filter((f) => path.basename(f) === "page.tsx");

  it("each check the admin session before anything else (layouts don't re-run on client navigation)", () => {
    expect(pages.length).toBeGreaterThan(20);
    for (const page of pages) {
      const src = readFileSync(path.join(panel, page), "utf8");
      for (const fn of ["export default async function", "export async function generateMetadata"]) {
        const at = src.indexOf(fn);
        if (fn.startsWith("export default")) expect(at, `${page} must export an async page`).toBeGreaterThanOrEqual(0);
        if (at < 0) continue;
        const firstAwait = src.slice(at).match(/\bawait [\w.]+\(/)?.[0];
        expect(firstAwait, `${page}: ${fn} must start with \`await requireAdmin()\``).toBe("await requireAdmin(");
      }
    }
  });
});

describe("rate-limit keys", () => {
  it("buckets IPv6 clients by /64 and keeps IPv4 addresses whole", () => {
    expect(ipRateLimitKey("203.0.113.9")).toBe("203.0.113.9");
    expect(ipRateLimitKey("::ffff:203.0.113.9")).toBe("203.0.113.9");
    expect(ipRateLimitKey("2001:db8:aa:bb:1:2:3:4")).toBe("2001:db8:aa:bb::/64");
    expect(ipRateLimitKey("2001:0DB8:00aa:00bb:ffff::1")).toBe("2001:db8:aa:bb::/64");
    expect(ipRateLimitKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
    expect(ipRateLimitKey("[2001:db8:aa:bb::5]")).toBe("2001:db8:aa:bb::/64");
    expect(ipRateLimitKey("fe80::1%eth0")).toBe("fe80:0:0:0::/64");
    expect(ipRateLimitKey("::1")).toBe("0:0:0:0::/64");
    expect(ipRateLimitKey("unknown")).toBe("unknown");
    expect(ipRateLimitKey("")).toBe("unknown");
    expect(ipRateLimitKey("1::2::3")).toBe("1::2::3");
  });
});

describe("safeRedirectPath", () => {
  it("rejects paths a browser would turn into another origin", () => {
    for (const bad of ["/\t/example.org", "/\n/example.org", "/\r\n/example.org", "/\\example.org", "/\t\\example.org", "/%00", "//example.org", "///example.org", "https://example.org", "example.org", "", null, undefined]) {
      const result = safeRedirectPath(bad as string | null | undefined, "/learn");
      expect(result === "/learn" || (result.startsWith("/") && !result.startsWith("//"))).toBe(true);
      if (bad && /[\t\n\r\\]|^\/\/|^https?:/.test(bad)) expect(result).toBe("/learn");
    }
    expect(safeRedirectPath("/\u0000/example.org", "/learn")).toBe("/learn");
    expect(safeRedirectPath("/\u007f/example.org", "/learn")).toBe("/learn");
  });

  it("keeps ordinary same-site paths, query strings and fragments", () => {
    expect(safeRedirectPath("/learn/ai-essentials?lesson=2#notes", "/")).toBe("/learn/ai-essentials?lesson=2#notes");
    expect(safeRedirectPath("/admin", "/")).toBe("/admin");
    expect(safeRedirectPath("/learn/../admin", "/")).toBe("/admin");
    expect(safeRedirectPath("/learn/a b", "/")).toBe("/learn/a%20b");
  });
});

describe("email log", () => {
  it("redacts one-time sign-in tokens in stored emails", async () => {
    const html = '<a href="https://principe.ai/auth/verify?token=Qpor_BlM-x1">Sign in</a> https://principe.ai/auth/verify?token=abc%2Bdef';
    const redacted = redactSignInLinks(html);
    expect(redacted).not.toContain("Qpor_BlM");
    expect(redacted).not.toContain("abc%2Bdef");
    expect(redacted).toContain('href="https://principe.ai/auth/verify?token=[redacted]"');
    expect(hasRedactedSignInLink(redacted)).toBe(true);
    expect(hasRedactedSignInLink(html)).toBe(false);

    const to = `redact-${Date.now()}@example.com`;
    await sendEmail({ to, subject: "Your sign-in link", kind: "magic_link", markdown: "[Sign in →](https://principe.ai/auth/verify?token=SECRET_TOKEN_123)" });
    const db = await getDb();
    const [log] = await db.select().from(schema.emailLog).where(eq(schema.emailLog.to, to));
    expect(log.html).not.toContain("SECRET_TOKEN_123");
    expect(hasRedactedSignInLink(log.html)).toBe(true);
  });
});

describe("untrusted Markdown", () => {
  it("keeps the relative links used in AI plans clickable", async () => {
    const { Markdown } = await import("@/components/ui/markdown");
    const html = renderToStaticMarkup(Markdown({ untrusted: true, children: "[See the course](/courses/ai-essentials) or [book a call](/book/ai-strategy-call)" }));
    expect(html).toContain('<a href="/courses/ai-essentials">See the course</a>');
    expect(html).toContain('<a href="/book/ai-strategy-call">book a call</a>');
  });
});
