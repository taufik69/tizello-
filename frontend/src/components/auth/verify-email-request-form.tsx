"use client";

import { useActionState } from "react";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { TextField } from "@/components/ui/text-field";
import { requestRegistrationCodeAction } from "@/lib/actions/verify-actions";
import { validateEmail } from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

const EMPTY: AuthFormState = {};

/**
 * Shown when `/verify-email` is reached without an `email` query param — an
 * unverified account trying to log in and following "Resend code" from
 * `AuthAlert`, which has no address in hand. Collects one and, on success,
 * lands on `VerifyEmailCodeForm` via the redirect in
 * `requestRegistrationCodeAction`.
 */
export function VerifyEmailRequestForm() {
  const [state, formAction, pending] = useActionState(requestRegistrationCodeAction, EMPTY);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <TextField
        label="Send a new code to"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@company.com"
        validate={validateEmail}
        error={state.fieldErrors?.email}
        autoFocus
      />
      <AuthSubmit label="Send a new code" pending={pending} pendingLabel="Sending…" />
    </form>
  );
}
