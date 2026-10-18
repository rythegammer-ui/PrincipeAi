"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * GET filter form that keeps URLs shareable and tidy: empty fields are dropped, selects apply
 * immediately, and navigation is client-side. Without JS it falls back to a normal GET submit.
 */
export function CleanGetForm({ action, children, className, label }: { action: string; children: ReactNode; className?: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={action}
      method="get"
      role="search"
      aria-label={label}
      aria-busy={pending}
      className={cn(className, pending && "opacity-70 transition-opacity")}
      onChange={(e) => {
        if (e.target instanceof HTMLSelectElement) e.currentTarget.requestSubmit();
      }}
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        for (const [key, value] of new FormData(e.currentTarget)) {
          if (typeof value === "string" && value.trim() !== "") params.set(key, value.trim());
        }
        const qs = params.toString();
        startTransition(() => router.push(qs ? `${action}?${qs}` : action, { scroll: false }));
      }}
    >
      {children}
    </form>
  );
}
