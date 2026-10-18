import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Logo } from "@/components/ui/misc";
import { getAdminSession } from "@/lib/auth";
import { adminCredentials } from "@/lib/runtime-mode";
import { safeRedirectPath } from "@/lib/utils";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeRedirectPath(next, "/admin");
  if (await getAdminSession()) redirect(target.startsWith("/admin") ? target : "/admin");
  const creds = adminCredentials();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16">
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
              Set <code>ADMIN_EMAIL</code>, <code>ADMIN_PASSWORD</code> and <code>AUTH_SECRET</code> in your Vercel environment variables, then redeploy.
            </Alert>
          ) : (
            <>
              {creds.isDefault && (
                <Alert tone="info" title="Demo credentials" className="mb-5">
                  Email <code>{creds.email}</code> · password <code>demo1234</code>. Set <code>ADMIN_PASSWORD</code> to change this.
                </Alert>
              )}
              <AdminLoginForm next={target} defaultEmail={creds.isDefault ? creds.email : undefined} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
