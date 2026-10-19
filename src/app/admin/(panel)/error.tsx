"use client";

import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

/** Admin error boundary: renders inside the admin shell so navigation stays available. */
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;

  return (
    <div role="alert">
      <h1 className="sr-only">Something went wrong</h1>
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="This page couldn't load. It's often a temporary hiccup — try again, or use the menu to carry on elsewhere."
        className="mt-6"
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => retry()}>
              <RotateCw aria-hidden /> Try again
            </Button>
            <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft aria-hidden /> Back to dashboard
            </Link>
          </div>
        }
      />
      {digest && <p className="mt-4 text-center text-xs text-zinc-500">Reference: {digest} (shown in the server logs)</p>}
    </div>
  );
}
