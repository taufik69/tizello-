"use client";

import { useActionState, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { ResendButton } from "@/components/auth/resend-button";
import { TextField } from "@/components/ui/text-field";
import {
  forgotPasswordAction,
  resendRecoveryAction,
} from "@/lib/actions/password-actions";
import { normaliseEmail, validateEmail } from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

const EMPTY: AuthFormState = {};

/**
 * Spec §6.3. The confirmation is identical for a known and an unknown address,
 * and the action takes the same time either way — anything conditional here is
 * an enumeration oracle.
 */
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, EMPTY);
  const [email, setEmail] = useState("");

  if (state.done) {
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-text">
          If an account exists for{" "}
          <span className="font-semibold">{normaliseEmail(email)}</span>, a
          recovery link is on its way.
        </p>
        <p className="text-2xs text-text-subtle">
          It expires in an hour. Check your spam folder before resending.
        </p>
        <ResendButton
          email={normaliseEmail(email)}
          label="Resend link"
          resend={resendRecoveryAction}
        />
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <AuthAlert code={state.code} />

      <TextField
        label="We'll send a recovery link to"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@company.com"
        validate={validateEmail}
        error={state.fieldErrors?.email}
        onValueChange={setEmail}
        autoFocus
      />

      <AuthSubmit label="Send recovery link" pending={pending} pendingLabel="Sending…" />
    </form>
  );
}
