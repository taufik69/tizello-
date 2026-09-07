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
        {email ? <VerifyEmailCodeForm email={email} /> : <VerifyEmailRequestForm />}
      </AuthColumn>

      <AuthAside variant="verify-email" />
    </>
  );
}
