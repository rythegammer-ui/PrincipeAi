import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Logo } from "@/components/ui/misc";
import { getAdminSession } from "@/lib/auth";
import { adminCredentials, isDemoMode, MIN_ADMIN_PASSWORD_LENGTH, MIN_AUTH_SECRET_LENGTH } from "@/lib/runtime-mode";
import { safeRedirectPath } from "@/lib/utils";
import { AdminLoginForm, TeamLinkForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; method?: string }> }) {
  const { next, method } = await searchParams;
  const target = safeRedirectPath(next, "/admin");
  // Team members (Admin → Admin Team) get an emailed link; the owner signs in with the password from Vercel.
  const byLink = method === "link";
  const withMethod = (m: "link" | null) => {
    const q = new URLSearchParams();
    if (target !== "/admin") q.set("next", target);
    if (m) q.set("method", m);
    const query = q.toString();
    return query ? `/admin/login?${query}` : "/admin/login";
  };
  if (await getAdminSession()) redirect(target.startsWith("/admin") ? target : "/admin");
  const creds = adminCredentials();

  return (
    <main id="main" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lift">
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your dashboard</h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">Manage leads, bookings, courses and automations.</p>
          {!creds ? (
            <Alert tone="warning" title="Admin login isn't configured">
              Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> (at least {MIN_ADMIN_PASSWORD_LENGTH} characters) and <code>AUTH_SECRET</code> (at
              least {MIN_AUTH_SECRET_LENGTH} characters, e.g. from <code>openssl rand -base64 32</code>) in your Vercel environment variables, then redeploy.
              {isDemoMode() && " In demo mode the demo login is only offered while no live email, payment or AI keys are set."}
            </Alert>
          ) : (
            <>
              {creds.isDefault && (
                <Alert tone="info" title="Demo credentials" className="mb-5">
                  Email <code>{creds.email}</code> · password <code>demo1234</code>. Set <code>ADMIN_PASSWORD</code> and <code>AUTH_SECRET</code> to change this.
                </Alert>
              )}
              {byLink ? (
                <>
                  <p className="-mt-2 mb-4 text-sm text-zinc-600">Admin team members sign in with a one-time link sent to their email.</p>
                  <TeamLinkForm next={target} />
                  <Link href={withMethod(null)} className="mt-6 flex min-h-11 items-center justify-center text-sm font-medium text-brand-700 hover:underline">
                    Sign in with a password instead
                  </Link>
                </>
              ) : (
                <>
                  <AdminLoginForm next={target} defaultEmail={creds.isDefault ? creds.email : undefined} />
                  <Link
                    href={withMethod("link")}
                    className="mt-6 flex min-h-11 items-center justify-center border-t border-zinc-100 pt-5 text-sm font-medium text-brand-700 hover:underline"
                  >
                    Team member? Sign in with an email link
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
