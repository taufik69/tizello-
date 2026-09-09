import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthNotice } from "@/components/auth/auth-notice";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Tizello account.",
};

/*
 * Only the token's PRESENCE is checked here, not its validity.
 *
 * The fixture could classify a token on sight; the real API cannot be asked
 * without consuming it — redeeming a reset token is the only operation that
 * reads it, and it is single-use by design. A "check this token" endpoint would
 * mean a second way to probe reset tokens and a window in which one has been
 * validated but not yet spent.
 *
 * So a token that is present but dead surfaces on submit, where
 * `resetPassword` returns TOKEN_INVALID or TOKEN_EXPIRED and the form renders
 * the same notice. Only a link with no token at all is rejected before render.
 */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" && token.length > 0 ? token : undefined;

  if (!value) {
    return (
      <>
        <AuthColumn heading="This link isn't valid.">
          <AuthNotice
            body="Recovery links last an hour and can only be used once. Send yourself a new one and we'll get you back in."
            actionHref="/forgot-password"
            actionLabel="Request a new link"
          />
        </AuthColumn>
        <AuthAside variant="reset-password" />
      </>
    );
  }

  return (
    <>
      <AuthColumn
        heading="Set a new password"
        sub="Use at least 8 characters. You'll log in again with it."
      >
        <ResetPasswordForm token={value} />
      </AuthColumn>
      <AuthAside variant="reset-password" />
    </>
  );
}
