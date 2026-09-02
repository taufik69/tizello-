"use client";

import { useActionState, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { PasswordField } from "@/components/ui/password-field";
import { PasswordStrength } from "@/components/ui/password-strength";
import { resetPasswordAction } from "@/lib/actions/password-actions";
import { passwordScore, validatePassword } from "@/lib/validation/auth";
import type { AuthFormState } from "@/types/auth";

const EMPTY: AuthFormState = {};

/**
 * Spec §6.4. On success the action sends the user to `/sign-in?reset=1` rather
 * than signing them in — possession of the link is not proof of identity
 * strong enough for a session.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, EMPTY);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <AuthAlert code={state.code} />

      <div>
        <PasswordField
          label="New password"
          name="password"
          autoComplete="new-password"
          validate={validatePassword}
          error={state.fieldErrors?.password}
          onValueChange={setPassword}
          autoFocus
        />
        <PasswordStrength score={passwordScore(password)} />
      </div>

      <PasswordField
        label="Confirm password"
        name="confirm"
        autoComplete="new-password"
        validate={(value) =>
          value === password ? null : "Passwords don't match."
        }
        error={state.fieldErrors?.confirm}
      />

      <AuthSubmit label="Set new password" pending={pending} pendingLabel="Saving…" />
    </form>
  );
}
