import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { authSecret } from "@/lib/runtime-mode";

/**
 * Runs before every page request:
 * 1. Assigns an anonymous visitor id + captures first-touch attribution (UTM, referrer, landing page)
 *    into cookies, so funnel analytics and CRM attribution work without client JS.
 * 2. Optimistic auth gate for /admin and /learn page loads (the real checks happen again in layouts +
 *    actions; server action POSTs pass straight through to those checks).
 */

const YEAR = 60 * 60 * 24 * 365;
const ATTRIBUTION_TTL = 60 * 60 * 24 * 90;

async function hasValidSession(token: string | undefined, role: "admin" | "student"): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"] });
    return payload.role === role;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;

  // Server Function (action) calls POST to the page URL. A 307 to a login page would hand the
  // action client HTML instead of an RSC payload and crash the page, losing the user's input.
  // Every server function re-checks auth itself (assertAdmin / getStudent → redirect), which
  // the client turns into a proper navigation to the login page.
  const isServerAction = request.method === "POST" && request.headers.has("next-action");
  if (isServerAction && (pathname.startsWith("/admin") || pathname.startsWith("/learn"))) return NextResponse.next();

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await hasValidSession(request.cookies.get("pa_admin")?.value, "admin"))) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/learn" || pathname.startsWith("/learn/")) {
    if (!(await hasValidSession(request.cookies.get("pa_student")?.value, "student"))) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  // Never attribute internal pages.
  if (pathname.startsWith("/admin") || pathname.startsWith("/learn")) return NextResponse.next();

  const toSet: { name: string; value: string; maxAge: number }[] = [];

  if (!request.cookies.get("pa_vid")) {
    toSet.push({ name: "pa_vid", value: crypto.randomUUID(), maxAge: 2 * YEAR });
    // First visit: remember where they came from.
    const ref = request.headers.get("referer");
    if (ref && !ref.startsWith(request.nextUrl.origin)) {
      toSet.push({ name: "pa_ref", value: ref.slice(0, 500), maxAge: ATTRIBUTION_TTL });
    }
    toSet.push({ name: "pa_land", value: (pathname + search).slice(0, 500), maxAge: ATTRIBUTION_TTL });
  }

  // First-touch UTM attribution.
  if (!request.cookies.get("pa_utm")) {
    const utm: Record<string, string> = {};
    for (const key of ["source", "medium", "campaign", "term", "content"]) {
      const v = searchParams.get(`utm_${key}`);
      if (v) utm[key] = v.slice(0, 200);
    }
    if (Object.keys(utm).length) toSet.push({ name: "pa_utm", value: JSON.stringify(utm), maxAge: ATTRIBUTION_TTL });
  }

  if (!toSet.length) return NextResponse.next();

  // Expose the new cookies to this same request's server components, then persist them.
  for (const c of toSet) request.cookies.set(c.name, c.value);
  const response = NextResponse.next({ request: { headers: request.headers } });
  for (const c of toSet) {
    response.cookies.set(c.name, c.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: c.maxAge,
    });
  }
  return response;
}

export const config = {
  matcher: [
    // All pages except Next internals, API routes, and static files.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)",
  ],
};
