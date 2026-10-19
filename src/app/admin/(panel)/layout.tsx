import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminMobileNav, AdminSidebarNav } from "@/components/admin/admin-nav";
import { Logo } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth";
import { integrations } from "@/lib/integrations";
import { adminLogoutAction } from "../login/actions";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s · Admin" }, robots: { index: false } };
// Admin pages always show live data.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const status = integrations();
  // /api/cron refuses every call in production without CRON_SECRET (see authorizeCron), so say so loudly.
  const cronBlocked = process.env.NODE_ENV === "production" && !status.cron && !status.demoMode;
  // On a live site without Resend, emails are only logged and the sign-in link is never shown (see emailStatus).
  const emailMissing = process.env.NODE_ENV === "production" && !status.email && !status.demoMode;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 overflow-y-auto bg-ink p-4 lg:flex">
        <Link href="/admin" className="px-2 pt-2">
          <Logo light />
        </Link>
        <AdminSidebarNav />
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">
          <p className="truncate font-medium text-zinc-200">{session.email}</p>
          <div className="mt-2 flex items-center justify-between">
            <Link href="/" target="_blank" className="inline-flex items-center gap-1 hover:text-white">
              View site <ExternalLink className="size-3" />
            </Link>
            <form action={adminLogoutAction}>
              <button type="submit" className="inline-flex items-center gap-1 hover:text-white">
                <LogOut className="size-3" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <AdminMobileNav email={session.email} />
          <Link href="/admin" aria-label="Admin dashboard">
            <Logo />
          </Link>
        </header>
        {cronBlocked && (
          <div role="status" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-900 sm:text-sm">
            Scheduled jobs are not running: <code className="font-mono">CRON_SECRET</code> isn&apos;t set, so Vercel Cron calls are rejected and
            follow-up automation emails and booking reminders are paused. Add it in Vercel and redeploy.{" "}
            <Link href="/admin/settings#integration-cron" className="underline">
              How to fix
            </Link>
          </div>
        )}
        {emailMissing && (
          <div role="status" className="border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-medium text-red-900 sm:text-sm">
            Email isn&apos;t connected: students can&apos;t sign in, and receipts and booking confirmations aren&apos;t sent. Add{" "}
            <code className="font-mono">RESEND_API_KEY</code> in Vercel and redeploy.{" "}
            <Link href="/admin/settings#integration-email" className="underline">
              How to fix
            </Link>
          </div>
        )}
        {status.demoMode && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 sm:text-sm">
            Demo mode: no database is connected, so data resets periodically. Add a Postgres database (DATABASE_URL) in Vercel to go live.{" "}
            <Link href="/admin/settings" className="underline">
              Setup guide
            </Link>
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
