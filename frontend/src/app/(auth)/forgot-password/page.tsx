import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthFooter } from "@/components/auth/auth-footer";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Can't log in?",
  description: "Send yourself a recovery link and get back into your Tizello account.",
};

/*
 * "Recovery", not "reset password" — Trello's framing, kept as-is. The common
 * failure is not knowing which method you used, not just forgetting a string.
 */
export default function ForgotPasswordPage() {
  return (
    <>
      <AuthColumn
        heading="Can't log in?"
        sub="We'll email you a link that gets you back in."
      >
        <ForgotPasswordForm />

        <AuthFooter href="/sign-in" label="Return to log in" />
      </AuthColumn>

      <AuthAside variant="forgot-password" />
    </>
  );
}
