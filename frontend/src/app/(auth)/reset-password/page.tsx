import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthNotice } from "@/components/auth/auth-notice";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { readToken } from "@/lib/auth-fixtures";

export const metadata = {
  title: "Set a new password",
  description: "Choose a new password for your Tizello account.",
};

/*
 * The token is read from searchParams and checked BEFORE render: a missing,
 * malformed, expired or consumed token renders the notice and no form at all,
 * rather than a form that will fail on submit.
 */
export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : undefined;
  const state = readToken(value);

  if (state !== "valid" || !value) {
    return (
      <>
        <AuthColumn
          heading={state === "expired" ? "This link has expired." : "This link isn't valid."}
        >
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
