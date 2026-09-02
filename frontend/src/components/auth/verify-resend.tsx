import { ResendButton } from "@/components/auth/resend-button";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { resendVerificationEmailAction } from "@/lib/actions/verify-actions";

/**
 * Resending a verification link. With an address in hand it is one button on a
 * 60s cooldown; without one — an expired link opened somewhere else — it has to
 * ask first.
 */
export function VerifyResend({ email }: { email?: string }) {
  if (!email) return <ResendVerificationForm />;

  return (
    <ResendButton
      email={email}
      label="Resend link"
      resend={resendVerificationEmailAction}
    />
  );
}
