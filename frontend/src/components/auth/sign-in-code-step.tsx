import { useEffect, useRef } from "react";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { ResendButton } from "@/components/auth/resend-button";
import { SignInIdentity } from "@/components/auth/sign-in-identity";
import { CodeInput } from "@/components/ui/code-input";
import { requestSignInCodeAction } from "@/lib/actions/auth-actions";

/*
 * Step 2, code mode — the fallback, reached via "Use a login code instead"
 * (password is `SignInForm`'s default now, see `.claude/specs/authentication.md`).
 * Still useful for anyone who never set a password, or forgot it: a code
 * sent to the address just typed cannot be forgotten the way a password can.
 *
 * The code request fires here, on entering step 2, never on step 1. The
 * endpoint answers 202 for every address, so it carries no signal about
 * whether an account exists (spec §9). The ref guards React's double-invoked
 * effects in development against sending two codes.
 */
export function SignInCodeStep({
  email,
  error,
  pending,
  onChangeEmail,
  onUsePassword,
}: {
  email: string;
  error?: string;
  pending: boolean;
  onChangeEmail: () => void;
  onUsePassword: () => void;
}) {
  const requestedFor = useRef<string | null>(null);

  useEffect(() => {
    if (requestedFor.current === email) return;
    requestedFor.current = email;
    void requestSignInCodeAction(email);
  }, [email]);

  return (
    <>
      <SignInIdentity email={email} onChange={onChangeEmail} />
      <input type="hidden" name="email" value={email} />

      <p className="text-sm text-text-muted">
        We sent a 6-digit code to your inbox. It expires in 10 minutes.
      </p>

      <CodeInput label="Login code" error={error} />

      <AuthSubmit label="Log in" pending={pending} pendingLabel="Checking code…" />

      <div className="flex flex-col items-start gap-1.5">
        <ResendButton email={email} label="Resend code" resend={requestSignInCodeAction} />
        <button
          type="button"
          onClick={onUsePassword}
          className="rounded-sm text-2xs font-semibold text-text-brand transition-colors duration-100 ease-standard hover:underline"
        >
          Use a password instead
        </button>
      </div>
    </>
  );
}
