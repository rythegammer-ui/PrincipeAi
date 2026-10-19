"use client";

import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

/** Student-portal error boundary: keeps the portal header and offers a retry or a way back to "My courses". */
export default function LearnError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16" role="alert">
      <h1 className="sr-only">Something went wrong</h1>
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="This page didn't load properly. Your progress is saved — try again, or head back to your courses."
        className="bg-white"
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => retry()}>
              <RotateCw aria-hidden /> Try again
            </Button>
            <Link href="/learn" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft aria-hidden /> My courses
            </Link>
          </div>
        }
      />
      {digest && <p className="mt-4 text-center text-xs text-zinc-500">Reference: {digest}</p>}
    </div>
  );
}
