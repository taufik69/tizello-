import { AUTH_BUTTON } from "@/components/auth/auth-submit";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/ui/text-field";
import { validateEmail } from "@/lib/validation/auth";
import type { Ref } from "react";

/*
 * Step 1. It makes NO server call (spec §6.2): the email's shape is checked in
 * the browser and the form advances. Trello's equivalent looks the account up,
 * which tells an attacker whether an address is registered — an enumeration
 * oracle on an unauthenticated endpoint. Same two-step feel, no oracle.
 *
 * Continue is `type="button"` and Enter is intercepted, so nothing here can
 * reach the Server Action.
 */
export function SignInEmailStep({
  email,
  error,
  inputRef,
  remember,
  onEmailChange,
  onRememberChange,
  onContinue,
}: {
  email: string;
  error?: string;
  inputRef: Ref<HTMLInputElement>;
  remember: boolean;
  onEmailChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onContinue: () => void;
}) {
  return (
    <>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="you@company.com"
        defaultValue={email}
        inputRef={inputRef}
        validate={validateEmail}
        error={error}
        onValueChange={onEmailChange}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          onContinue();
        }}
      />

      {/* Session length is a property of the session, not of the password —
          so the control belongs here, on step 1. Default off. */}
      <Checkbox
        name="remember"
        label="Remember me for 30 days"
        checked={remember}
        onChange={(event) => onRememberChange(event.target.checked)}
      />

      <button type="button" onClick={onContinue} className={AUTH_BUTTON}>
        Continue
      </button>
    </>
  );
}
