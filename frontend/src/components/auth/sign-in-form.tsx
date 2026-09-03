"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { SignInCodeStep } from "@/components/auth/sign-in-code-step";
import { SignInEmailStep } from "@/components/auth/sign-in-email-step";
import { SignInPasswordStep } from "@/components/auth/sign-in-password-step";
import { signInAction } from "@/lib/actions/auth-actions";
import { normaliseEmail, validateEmail } from "@/lib/validation/auth";
import type { AuthFormState, SignInMode } from "@/types/auth";

const EMPTY: AuthFormState = {};

const ANNOUNCE: Record<SignInMode, string> = {
  code: "Step 2 of 2. Enter the 6-digit code we sent you.",
  password: "Step 2 of 2. Enter your password.",
};

/**
 * The two-step machine. Only `step` and `mode` live here; each step renders
 * itself. The three steps are separate files because two axes of state plus
 * three field layouts is more than one file's worth of work (spec §11).
 */
export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, EMPTY);
  const [step, setStep] = useState<1 | 2>(1);
  const [mode, setMode] = useState<SignInMode>("code");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [remember, setRemember] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  /* Focus follows the step. Step 2's own field autofocuses on mount, so it
     remounts — and refocuses — whenever the mode changes. */
  useEffect(() => {
    if (step === 1) emailRef.current?.focus();
  }, [step]);

  function advance() {
    const value = normaliseEmail(email);
    const invalid = validateEmail(value);
    setEmailError(invalid ?? undefined);
    if (invalid) return;
    setEmail(value);
    setStep(2);
    setAnnouncement(ANNOUNCE[mode]);
  }

  function back() {
    setStep(1);
    setAnnouncement("Step 1 of 2. Enter your email address.");
  }

  function switchTo(target: SignInMode) {
    setMode(target);
    setAnnouncement(ANNOUNCE[target]);
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="mode" value={mode} />
      {step === 2 && remember && <input type="hidden" name="remember" value="on" />}

      <AuthAlert code={state.code} />

      {/* Keyed on the step AND the mode so a swap remounts — which is what
          re-runs `auth-enter`. Each step already owns its own focus, so the
          remount costs nothing. */}
      <div key={`${step}-${mode}`} className="auth-enter space-y-4">
        {step === 1 ? (
          <SignInEmailStep
            email={email}
            error={emailError ?? state.fieldErrors?.email}
            inputRef={emailRef}
            remember={remember}
            onEmailChange={setEmail}
            onRememberChange={setRemember}
            onContinue={advance}
          />
        ) : mode === "code" ? (
          <SignInCodeStep
            email={email}
            error={state.fieldErrors?.code}
            pending={pending}
            onChangeEmail={back}
            onUsePassword={() => switchTo("password")}
          />
        ) : (
          <SignInPasswordStep
            email={email}
            error={state.fieldErrors?.password}
            pending={pending}
            onChangeEmail={back}
            onUseCode={() => switchTo("code")}
          />
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </form>
  );
}
