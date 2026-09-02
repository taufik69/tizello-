import Link from "next/link";
import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
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

        <p className="mt-6 text-center text-sm text-text-muted">
          <Link href="/sign-in" className="font-semibold text-text-brand">
            Return to log in
          </Link>
        </p>
      </AuthColumn>

      <AuthAside variant="forgot-password" />
    </>
  );
}
