import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/misc";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lift">
          <h1 className="text-xl font-semibold tracking-tight">You&apos;re almost in</h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">Confirm to sign in to your student portal.</p>
          <VerifyForm token={token} />
        </div>
      </div>
    </div>
  );
}
