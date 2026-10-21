import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { adminCredentials, authSecret } from "@/lib/runtime-mode";
import { adminCredentialVersion, verifySessionToken, type SessionPayload } from "@/lib/session-token";
import { normalizeEmail, safeRedirectPath } from "@/lib/utils";

export const ADMIN_COOKIE = "pa_admin";
export const STUDENT_COOKIE = "pa_student";

const ADMIN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days
const STUDENT_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
const LOGIN_TOKEN_TTL_MIN = 30;

async function sign(payload: SessionPayload, ttlSec: number, extra: Record<string, string | number> = {}): Promise<string> {
  return new SignJWT({ ...extra, role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(authSecret());
}

/**
 * The same check the proxy runs on every /admin and /learn page request (see lib/session-token.ts): admin
 * cookies must also match the current admin login (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_VERSION).
 */
export const verifySession = verifySessionToken;

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function hashSecret(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

/** Constant-time check of admin credentials against ADMIN_EMAIL / ADMIN_PASSWORD. */
export function checkAdminCredentials(email: string, password: string): boolean {
  const creds = adminCredentials();
  if (!creds) return false;
  const emailOk = timingSafeEqual(hashSecret(normalizeEmail(email)), hashSecret(creds.email));
  const passOk = timingSafeEqual(hashSecret(password), hashSecret(creds.password));
  return emailOk && passOk;
}

export async function startAdminSession(email: string) {
  const creds = adminCredentials();
  if (!creds) throw new Error("Admin login isn't configured.");
  const token = await sign({ sub: "admin", role: "admin", email: normalizeEmail(email) }, ADMIN_TTL_SEC, { cv: adminCredentialVersion(creds) });
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions(ADMIN_TTL_SEC));
}

/**
 * Signs in an admin team member (admin_members), after they used an emailed sign-in link. Their cookie is bound to
 * the owner's credentials like the owner's own (`cv`), and to their session version (`tm`), which removal bumps.
 */
export async function startTeamAdminSession(member: Pick<schema.AdminMember, "id" | "email" | "sessionVersion">) {
  const creds = adminCredentials();
  if (!creds) throw new Error("Admin login isn't configured.");
  const token = await sign({ sub: member.id, role: "admin", email: member.email }, ADMIN_TTL_SEC, {
    cv: adminCredentialVersion(creds),
    tm: member.sessionVersion,
  });
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions(ADMIN_TTL_SEC));
}

/** The admin team member with this email who can sign in (not removed), or null. */
export async function activeAdminMember(email: string): Promise<schema.AdminMember | null> {
  const db = await getDb();
  const [member] = await db
    .select()
    .from(schema.adminMembers)
    .where(and(eq(schema.adminMembers.email, normalizeEmail(email)), isNull(schema.adminMembers.removedAt)))
    .limit(1);
  return member ?? null;
}

/**
 * Signs this browser out. Sessions are stateless JWTs, so a copy of the cookie taken earlier stays valid
 * until it expires; to end every admin session change ADMIN_PASSWORD or ADMIN_SESSION_VERSION (removing a
 * team member in Admin → Team ends theirs).
 */
export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The signed-in admin: the owner, or a team member who is still on the team (checked against the database). */
export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  const session = await verifySession(token, "admin");
  if (!session || session.teamVersion === undefined) return session;
  if (!UUID.test(session.sub)) return null;
  const db = await getDb();
  const [member] = await db
    .select({ email: schema.adminMembers.email })
    .from(schema.adminMembers)
    .where(
      and(
        eq(schema.adminMembers.id, session.sub),
        isNull(schema.adminMembers.removedAt),
        eq(schema.adminMembers.sessionVersion, session.teamVersion),
      ),
    )
    .limit(1);
  return member && member.email === session.email ? session : null;
}

/**
 * Use at the top of EVERY admin page (and any generateMetadata that reads data), not only in the panel layout:
 * a client-side navigation re-renders just the page segment, so a layout check alone doesn't guard it.
 * Redirects to the login page when not signed in.
 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Use at the top of EVERY admin server action / admin API route. When not signed in (expired
 * session, signed out in another tab) it redirects to the login page: inside a server action
 * that becomes a client-side navigation instead of an error screen. Route handlers that want a
 * 401 instead wrap it in try/catch (`redirect()` throws).
 */
export async function assertAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/* ------------------------------------------------------------------ */
/* Students (magic link)                                               */
/* ------------------------------------------------------------------ */

/** Creates a single-use login token and returns the raw token (to be emailed as a link). */
export async function createLoginToken(email: string, redirectTo = "/learn"): Promise<string> {
  const db = await getDb();
  const raw = randomBytes(32).toString("base64url");
  await db.insert(schema.loginTokens).values({
    tokenHash: hashSecret(raw).toString("hex"),
    email: normalizeEmail(email),
    redirectTo: safeRedirectPath(redirectTo, "/learn"),
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_TTL_MIN * 60_000),
  });
  return raw;
}

/** True for a sign-in link into the admin dashboard (an admin team member's), as opposed to /learn or /agent. */
export function isAdminRedirect(path: string): boolean {
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/admin?");
}

export type LoginResult =
  | { kind: "student"; user: schema.User; redirectTo: string }
  | { kind: "admin"; member: schema.AdminMember; redirectTo: string };

/**
 * Validates + consumes a login token. A link into /admin signs in an admin team member (null when that address is no
 * longer on the team); any other link a student or sales agent (their portal checks what they may see).
 */
export async function consumeLoginToken(raw: string): Promise<LoginResult | null> {
  if (!raw || raw.length > 200) return null;
  const db = await getDb();
  const tokenHash = hashSecret(raw).toString("hex");
  const [token] = await db
    .update(schema.loginTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.loginTokens.tokenHash, tokenHash),
        isNull(schema.loginTokens.usedAt),
        gt(schema.loginTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!token) return null;
  if (isAdminRedirect(token.redirectTo)) {
    const member = await activeAdminMember(token.email);
    if (!member) return null;
    await db.update(schema.adminMembers).set({ lastLoginAt: new Date() }).where(eq(schema.adminMembers.id, member.id));
    return { kind: "admin", member, redirectTo: token.redirectTo };
  }
  const user = await upsertStudent(token.email);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  return { kind: "student", user, redirectTo: token.redirectTo };
}

/**
 * Finds or creates the student user for an email, linking it to the CRM contact when one exists. The student's name
 * (portal greeting, certificate) only comes from `name` (checkout, admin grant): never from the contact, whose name
 * is whatever the first public form submitted with this address said, and a stranger can submit any address.
 */
export async function upsertStudent(email: string, name?: string | null): Promise<schema.User> {
  const db = await getDb();
  const normalized = normalizeEmail(email);
  const given = name?.trim() || null;
  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, normalized)).limit(1);
  const [user] = await db
    .insert(schema.users)
    .values({ email: normalized, name: given, contactId: contact?.id ?? null })
    .onConflictDoUpdate({
      target: schema.users.email,
      // Fill a missing name with the one given (e.g. a later purchase) but never overwrite one already set.
      set: given
        ? { updatedAt: new Date(), name: sql`coalesce(nullif(btrim(${schema.users.name}), ''), excluded.name)` }
        : { updatedAt: new Date() },
    })
    .returning();
  if (!user.contactId && contact) {
    await db.update(schema.users).set({ contactId: contact.id }).where(eq(schema.users.id, user.id));
    user.contactId = contact.id;
  }
  return user;
}

export async function startStudentSession(user: Pick<schema.User, "id" | "email">) {
  const token = await sign({ sub: user.id, role: "student", email: user.email }, STUDENT_TTL_SEC);
  (await cookies()).set(STUDENT_COOKIE, token, cookieOptions(STUDENT_TTL_SEC));
}

export async function endStudentSession() {
  (await cookies()).delete(STUDENT_COOKIE);
}

/** The signed-in student (fresh from the DB), or null. */
export async function getStudent(): Promise<schema.User | null> {
  const session = await verifySession((await cookies()).get(STUDENT_COOKIE)?.value, "student");
  if (!session) return null;
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.sub)).limit(1);
  return user ?? null;
}

export async function requireStudent(next = "/learn"): Promise<schema.User> {
  const user = await getStudent();
  if (!user) redirect(`/login?next=${encodeURIComponent(safeRedirectPath(next, "/learn"))}`);
  return user;
}
