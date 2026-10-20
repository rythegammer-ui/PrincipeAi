import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/misc";
import { currentAgent } from "@/lib/sales/agents";
import { AgentLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sales agent sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AgentLoginPage() {
  if (await currentAgent()) redirect("/agent");
  return (
    <main id="main" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lift">
          <p className="eyebrow">Sales team</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Sign in to your agent dashboard</h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">Your sales, earnings, level and the team leaderboard. No password needed.</p>
          <AgentLoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Not on the team yet?{" "}
          <Link href="/sales-team" className="font-medium text-brand-700 hover:underline">
            Apply to join
          </Link>
        </p>
      </div>
    </main>
  );
}
