"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setUnsubscribedAction } from "@/app/admin/(panel)/contacts/actions";
import { cn } from "@/lib/utils";

export function UnsubscribeToggle({ contactId, unsubscribed }: { contactId: string; unsubscribed: boolean }) {
  const [value, setValue] = useOptimistic(unsubscribed);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const subscribed = !value;
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={subscribed}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            setValue(!value);
            const res = await setUnsubscribedAction(contactId, !value);
            if (!res.ok) setError(res.error);
          });
        }}
        className="inline-flex items-center gap-2.5 rounded-lg text-sm text-zinc-700 focus-visible:outline-2 focus-visible:outline-brand-500 disabled:opacity-70"
      >
        <span className={cn("relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors", subscribed ? "bg-brand-600" : "bg-zinc-300")}>
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", subscribed ? "translate-x-[18px]" : "translate-x-0.5")} />
        </span>
        {subscribed ? "Subscribed to marketing email" : "Unsubscribed from marketing email"}
      </button>
      {error && <p role="alert" className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
