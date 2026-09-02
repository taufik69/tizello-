"use client";

import { useActionState, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { PasswordField } from "@/components/ui/password-field";
import { PasswordStrength } from "@/components/ui/password-strength";
import { TextField } from "@/components/ui/text-field";
import { signUpAction } from "@/lib/actions/auth-actions";
import {
  passwordScore,
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

const EMPTY: AuthFormState = {};

/**
 * Spec §6.1. The terms line is static text, not a checkbox: a checkbox implies
 * a consent record the backend does not yet store, and faking one is worse than
 * omitting it.
 *
 * `noValidate` hands validation to us — the browser's own bubbles cannot be
 * styled, positioned or announced the way the rest of the form is.
 */
export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, EMPTY);
  const [score, setScore] = useState(0);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <AuthAlert code={state.code} />

      <TextField
        label="Full name"
        name="name"
        autoComplete="name"
        placeholder="Alex Rahman"
        validate={validateName}
        error={state.fieldErrors?.name}
      />

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        validate={validateEmail}
        error={state.fieldErrors?.email}
      />

      <div>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          validate={validatePassword}
          error={state.fieldErrors?.password}
          onValueChange={(value) => setScore(passwordScore(value))}
        />
        <PasswordStrength score={score} />
      </div>

      <p className="text-2xs text-text-subtle">
        By signing up you agree to the{" "}
        <a href="/terms" className="underline hover:text-text-muted">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="underline hover:text-text-muted">
          Privacy Policy
        </a>
        .
      </p>

      <AuthSubmit label="Sign up" pending={pending} pendingLabel="Creating account…" />
    </form>
  );
}
