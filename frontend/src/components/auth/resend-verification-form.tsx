"use client";

import { useActionState } from "react";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { TextField } from "@/components/ui/text-field";
import { resendVerificationAction } from "@/lib/actions/verify-actions";
import { validateEmail } from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

const EMPTY: AuthFormState = {};

/**
 * Shown when we reach `/verify-email` without knowing which address to send
 * to — an expired link opened in a different browser, say. The confirmation is
 * the same for a known and an unknown address.
 */
export function ResendVerificationForm() {
  const [state, formAction, pending] = useActionState(resendVerificationAction, EMPTY);

  if (state.done) {
    return (
      <p role="status" className="text-sm text-text">
        If that address needs verifying, a new link is on its way.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <TextField
        label="Send a new link to"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@company.com"
        validate={validateEmail}
        error={state.fieldErrors?.email}
      />
      <AuthSubmit label="Send a new link" pending={pending} pendingLabel="Sending…" />
    </form>
  );
}
