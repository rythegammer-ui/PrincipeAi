"use client";

import { AlertTriangle, Home, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";

/** Marketing error boundary: renders inside the site header and footer, with a retry and a way home. */
export default function MarketingError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <div className="bg-white" role="alert">
      <div className="container-narrow flex flex-col items-center py-16 text-center sm:py-24">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-4xl">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-zinc-600">
          This page didn&apos;t load properly. It&apos;s usually a temporary hiccup — please try again.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => retry()}>
            <RotateCw aria-hidden /> Try again
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
            <Home aria-hidden /> Back to home
          </Link>
        </div>
        {digest && <p className="mt-6 text-xs text-zinc-500">Reference: {digest}</p>}
      </div>
    </div>
  );
}
