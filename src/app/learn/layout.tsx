import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, Logo } from "@/components/ui/misc";
import { requireStudent } from "@/lib/auth";
import { studentLogoutAction } from "../login/actions";

export const metadata: Metadata = {
  title: { default: "My courses", template: "%s · Principe AI" },
  robots: { index: false, follow: false },
};
// The student portal always shows live progress.
export const dynamic = "force-dynamic";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const student = await requireStudent("/learn");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-white px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6 lg:px-8">
          <Link href="/learn" aria-label="My courses" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Student portal" className="flex items-center gap-1">
            <Link href="/learn" className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 sm:px-3">
              My courses
            </Link>
            <Link
              href="/courses"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 sm:inline-flex"
            >
              Browse catalog
            </Link>
          </nav>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-56 truncate text-sm text-zinc-500 md:block" title={student.email}>
              {student.email}
            </span>
            <Avatar name={student.name} email={student.email} className="hidden size-8 sm:inline-flex" />
            <form action={studentLogoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
