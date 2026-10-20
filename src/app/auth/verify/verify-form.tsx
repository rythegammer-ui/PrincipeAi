"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { verifyMagicLinkAction, type VerifyState } from "../../login/actions";

export function VerifyForm({ token, button = "Continue to my courses", retryHref = "/login" }: { token: string; button?: string; retryHref?: string }) {
  const [state, action] = useActionState<VerifyState, FormData>(verifyMagicLinkAction, {});
  if (state.error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">{state.error}</Alert>
        <Link href={retryHref} className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Get a new link
        </Link>
      </div>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg" className="w-full" pendingText="Signing you in…">
        {button}
      </SubmitButton>
    </form>
  );
}
