"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { ResendButton } from "@/components/auth/resend-button";
import { CodeInput } from "@/components/ui/code-input";
import { resendRegistrationCodeAction, verifyRegistrationCodeAction } from "@/lib/actions/verify-actions";
import type { AuthFormState } from "@/types/auth";

const EMPTY: AuthFormState = {};

/**
 * The registration-code entry screen. Unlike `SignInCodeStep`, no code is
 * requested on mount here — `register()` already enqueued the first one as
 * part of sign-up, so this component only ever *shows* the entry form.
 *
 * Success is a redirect to the board, not a rendered "verified" state:
 * redeeming the code proves the address and signs the user in in the same
 * step (mirrors `codeSignIn` in auth-actions.ts for the login-code flow).
 */
export function VerifyEmailCodeForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(verifyRegistrationCodeAction, EMPTY);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <AuthAlert state={state} />

      <input type="hidden" name="email" value={email} />

      <p className="text-sm text-text-muted">
        We sent a 6-digit code to <span className="font-semibold text-text">{email}</span>.
        It expires in 5 minutes.
      </p>

      <CodeInput label="Confirmation code" error={state.fieldErrors?.code} />

      <AuthSubmit label="Verify" pending={pending} pendingLabel="Checking code…" />

      <div className="flex flex-col items-start gap-1.5">
        <ResendButton email={email} label="Resend code" resend={resendRegistrationCodeAction} />
        <p className="text-2xs text-text-subtle">
          Wrong address?{" "}
          <Link href="/sign-up" className="font-semibold text-text-brand">
            Sign up again
          </Link>
        </p>
      </div>
    </form>
  );
}
