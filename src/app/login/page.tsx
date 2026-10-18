import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/misc";
import { getStudent } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/utils";
import { MagicLinkForm } from "./login-form";

export const metadata: Metadata = { title: "Student login" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeRedirectPath(next, "/learn");
  if (await getStudent()) redirect(target);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-4 py-16">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center">
          <Logo />
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-lift">
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 mb-6 text-sm text-zinc-500">Sign in to continue your courses. No password needed.</p>
          <MagicLinkForm next={target} />
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Not a student yet?{" "}
          <Link href="/courses" className="font-medium text-brand-700 hover:underline">
            Browse courses
          </Link>
        </p>
      </div>
    </div>
  );
}
