"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { verifyMagicLinkAction, type VerifyState } from "../../login/actions";

export function VerifyForm({ token }: { token: string }) {
  const [state, action] = useActionState<VerifyState, FormData>(verifyMagicLinkAction, {});
  if (state.error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">{state.error}</Alert>
        <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Get a new link
        </Link>
      </div>
    );
  }
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <SubmitButton size="lg" className="w-full" pendingText="Signing you in…">
        Continue to my courses
      </SubmitButton>
    </form>
  );
}
