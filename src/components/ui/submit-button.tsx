"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonSize, type ButtonVariant } from "./button";

/**
 * Submit button that shows a spinner while its parent <form action={…}> is pending, and is disabled meanwhile (so a
 * double click can't submit twice), whatever `disabled` the caller passes.
 */
export function SubmitButton({
  children,
  pendingText,
  variant,
  size,
  disabled,
  pending: busy,
  ...props
}: ComponentProps<"button"> & {
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** For forms that submit through a transition instead of `<form action>`, which useFormStatus can't see. */
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = status.pending || Boolean(busy);
  return (
    <Button type="submit" variant={variant} size={size} {...props} disabled={pending || disabled} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
