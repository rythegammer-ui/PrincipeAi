import { Users } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

/** Shown to a signed-in visitor (e.g. a student) who isn't an active sales agent. */
export function NotAnAgent() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <Users className="size-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">This page is for the sales team</h1>
      <p className="mt-2 leading-relaxed text-zinc-600">
        You&apos;re signed in, but this email isn&apos;t on the sales team (or its application is still being reviewed). Sign in with the email you applied
        with, or apply to join.
      </p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Link href="/sales-team#apply" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}>
          Apply to join
        </Link>
        <Link href="/agent/login" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
          Use another email
        </Link>
      </div>
    </div>
  );
}
