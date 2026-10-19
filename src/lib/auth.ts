import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { adminCredentials, authSecret } from "@/lib/runtime-mode";
import { normalizeEmail, safeRedirectPath } from "@/lib/utils";

export const ADMIN_COOKIE = "pa_admin";
export const STUDENT_COOKIE = "pa_student";

const ADMIN_TTL_SEC = 60 * 60 * 24 * 7; // 7 days
const STUDENT_TTL_SEC = 60 * 60 * 24 * 30; // 30 days
const LOGIN_TOKEN_TTL_MIN = 30;

type SessionPayload = { sub: string; role: "admin" | "student"; email: string };

/**
 * Binds admin sessions to the current admin login: changing ADMIN_EMAIL / ADMIN_PASSWORD, or bumping
 * ADMIN_SESSION_VERSION, invalidates every admin cookie already issued (student sessions are unaffected).
 * Keyed with the signing secret so a token never allows offline guessing of the password.
 */
function adminCredentialVersion(creds: { email: string; password: string }): string {
  return createHmac("sha256", authSecret())
    .update(`${creds.email}\0${creds.password}\0${process.env.ADMIN_SESSION_VERSION ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

async function sign(payload: SessionPayload, ttlSec: number, extra: Record<string, string> = {}): Promise<string> {
  return new SignJWT({ ...extra, role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSec}s`)
    .sign(authSecret());
}

export async function verifySession(token: string | undefined, role: SessionPayload["role"]): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"] });
    if (payload.role !== role || typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    if (role === "admin") {
      const creds = adminCredentials();
      if (!creds || payload.email !== creds.email || payload.cv !== adminCredentialVersion(creds)) return null;
    }
    return { sub: payload.sub, role, email: payload.email };
  } catch {
    return null;
  }
}

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
 * Signs this browser out. Sessions are stateless JWTs, so a copy of the cookie taken earlier stays valid
 * until it expires; to end every admin session change ADMIN_PASSWORD or ADMIN_SESSION_VERSION.
 */
export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifySession(token, "admin");
}

/** Use in admin pages/layouts: redirects to the login page when not signed in. */
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

/** Validates + consumes a login token. Returns the student user and where to redirect, or null. */
export async function consumeLoginToken(raw: string): Promise<{ user: schema.User; redirectTo: string } | null> {
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
  const user = await upsertStudent(token.email);
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));
  return { user, redirectTo: token.redirectTo };
}

/** Finds or creates the student user for an email, linking it to the CRM contact when one exists. */
export async function upsertStudent(email: string, name?: string | null): Promise<schema.User> {
  const db = await getDb();
  const normalized = normalizeEmail(email);
  const [contact] = await db.select().from(schema.contacts).where(eq(schema.contacts.email, normalized)).limit(1);
  const [user] = await db
    .insert(schema.users)
    .values({ email: normalized, name: name ?? contact?.name ?? null, contactId: contact?.id ?? null })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { updatedAt: new Date() },
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
