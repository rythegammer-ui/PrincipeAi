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
          <AdminMobileNav />
          <Logo />
        </header>
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
