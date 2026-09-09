import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { VerifyEmailCodeForm } from "@/components/auth/verify-email-code-form";
import { VerifyEmailRequestForm } from "@/components/auth/verify-email-request-form";

export const metadata = {
  title: "Verify your email",
  description: "Confirm your address to finish setting up your Tizello account.",
};

/*
 * One state per whether we know the address: with `email` present (the normal
 * path — `signUpAction` redirects here right after `register()` enqueues the
 * first code), show the code-entry form. Without it (an unverified account's
 * "Resend code" from `AuthAlert`, which has no address in hand), collect one
 * first via `VerifyEmailRequestForm`.
 */
export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : undefined;
  /* Set by `signUpAction` when registration carried an invitation token the API
     would not apply — almost always because the account was created under a
     different address than the one invited. */
  const inviteUnapplied = params.invite === "unapplied";

  return (
    <>
      <AuthColumn
        heading={email ? "Check your inbox" : "Verify your email"}
        sub={
          email
            ? "Enter the code to finish setting up your account."
            : "Tell us where to send a new code."
        }
      >
        {inviteUnapplied && (
          <p
            role="status"
            className="mb-4 rounded-sm border border-warning bg-warning-subtle px-3 py-2 text-2xs text-text"
          >
            Your account was created, but the invitation was not applied — it
            was sent to a different address. Confirm this email, then open the
            invitation link again to join.
          </p>
        )}

        {email ? <VerifyEmailCodeForm email={email} /> : <VerifyEmailRequestForm />}
      </AuthColumn>

      <AuthAside variant="verify-email" />
    </>
  );
}
