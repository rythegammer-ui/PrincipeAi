import { createHmac } from "node:crypto";
import { jwtVerify } from "jose";
import { adminCredentials, authSecret } from "@/lib/runtime-mode";

/**
 * Session-cookie verification shared by `src/proxy.ts` (the optimistic gate in front of every /admin and /learn
 * page request, including client-side RSC navigations that skip the layouts) and `src/lib/auth.ts`. It has no
 * database, `next/headers` or `server-only` imports so the proxy can use it, and both apply the same rules: a
 * revoked admin cookie must not get past the proxy just because it is validly signed.
 */

export type SessionRole = "admin" | "student";
export type SessionPayload = {
  sub: string;
  role: SessionRole;
  email: string;
  /**
   * Admin team members only (admin_members, signed in by email link): the member's session version when the cookie
   * was signed. The owner's session (ADMIN_EMAIL / ADMIN_PASSWORD) has none. The proxy can't read the database, so
   * auth.ts checks it against the member's row (removing a member bumps it) on every admin page and action.
   */
  teamVersion?: number;
};

/**
 * Binds admin sessions to the current admin login: changing ADMIN_EMAIL / ADMIN_PASSWORD, or bumping
 * ADMIN_SESSION_VERSION, invalidates every admin cookie already issued (student sessions are unaffected).
 * Keyed with the signing secret so a token never allows offline guessing of the password.
 */
export function adminCredentialVersion(creds: { email: string; password: string }): string {
  return createHmac("sha256", authSecret())
    .update(`${creds.email}\0${creds.password}\0${process.env.ADMIN_SESSION_VERSION ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * The session in a signed cookie, or null when it is missing, expired, badly signed, for another role, or (admin)
 * no longer matches the current admin login: a missing or stale `cv` claim, or (the owner) a different ADMIN_EMAIL.
 * Team members' cookies carry the same `cv`, so changing ADMIN_PASSWORD or ADMIN_SESSION_VERSION signs them out too.
 */
export async function verifySessionToken(token: string | undefined, role: SessionRole): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"] });
    if (payload.role !== role || typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    if (role === "admin") {
      const creds = adminCredentials();
      if (!creds || payload.cv !== adminCredentialVersion(creds)) return null;
      if (payload.tm !== undefined) {
        if (typeof payload.tm !== "number" || !Number.isInteger(payload.tm) || payload.tm < 1) return null;
        return { sub: payload.sub, role, email: payload.email, teamVersion: payload.tm };
      }
      if (payload.email !== creds.email) return null;
    }
    return { sub: payload.sub, role, email: payload.email };
  } catch {
    return null;
  }
}
