import { AuthSubmit } from "@/components/auth/auth-submit";
import { SignInIdentity } from "@/components/auth/sign-in-identity";
import { PasswordField } from "@/components/ui/password-field";

/**
 * Step 2, password mode — the fallback for anyone who set one. No client-side
 * length rule: an existing 6-character password is still the right password,
 * and telling someone their own password is too short is nonsense.
 */
export function SignInPasswordStep({
  email,
  error,
  pending,
  onChangeEmail,
  onUseCode,
}: {
  email: string;
  error?: string;
  pending: boolean;
  onChangeEmail: () => void;
  onUseCode: () => void;
}) {
  return (
    <>
      <SignInIdentity email={email} onChange={onChangeEmail} />
      <input type="hidden" name="email" value={email} />

      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        error={error}
        autoFocus
      />

      <AuthSubmit label="Log in" pending={pending} pendingLabel="Signing in…" />

      <div className="flex flex-col items-start gap-1.5">
        <button
          type="button"
          onClick={onUseCode}
          className="rounded-sm text-2xs font-semibold text-text-brand transition-colors duration-100 ease-standard hover:underline"
        >
          Use a login code instead
        </button>
      </div>
    </>
  );
}
