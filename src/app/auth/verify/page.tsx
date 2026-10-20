import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Wording only: which link this is comes from the token itself (see consumeLoginToken). */
const COPY = {
  student: { lead: "Confirm to sign in to your student portal.", button: "Continue to my courses", retry: "/login" },
  agent: { lead: "Confirm to sign in to your sales agent portal.", button: "Continue to my dashboard", retry: "/agent/login" },
  admin: { lead: "Confirm to sign in to the admin dashboard.", button: "Continue to the dashboard", retry: "/admin/login" },
} as const;

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; for?: string }> }) {
  const { token = "", for: audience } = await searchParams;
  const copy = audience === "agent" || audience === "admin" ? COPY[audience] : COPY.student;
  return (
    <main id="main" className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lift">
          <h1 className="text-xl font-semibold tracking-tight">You&apos;re almost in</h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">{copy.lead}</p>
          <VerifyForm token={token} button={copy.button} retryHref={copy.retry} />
        </div>
      </div>
    </main>
  );
}
