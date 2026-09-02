import Link from "next/link";
import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AutoRedirect } from "@/components/auth/auto-redirect";
import { VerifyResend } from "@/components/auth/verify-resend";
import { verifyEmailToken } from "@/lib/auth-tokens";
import { BOARD_HOME } from "@/lib/session-cookie";

export const metadata = {
  title: "Verify your email",
  description: "Confirm your address to finish setting up your Tizello account.",
};

const HEADINGS = {
  verified: { heading: "Email verified", sub: "Taking you to your board." },
  expired: { heading: "This link has expired.", sub: "Verification links last 24 hours." },
  pending: { heading: "Check your inbox", sub: "Confirm your address to finish setting up." },
} as const;

/*
 * Three states, one route (spec §6.5). The token is consumed server-side on
 * load rather than in an effect, so the page never renders a "verifying…"
 * flicker and never depends on JavaScript to do the work.
 */
export default async function VerifyEmailPage({
  searchParams,
}: PageProps<"/verify-email">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const email = typeof params.email === "string" ? params.email : undefined;
  const result = token ? await verifyEmailToken(token) : null;

  const state = result ? (result.ok ? "verified" : "expired") : "pending";
  const { heading, sub } = HEADINGS[state];

  return (
    <>
      <AuthColumn heading={heading} sub={sub}>
        {state === "verified" && (
          <>
            <AutoRedirect to={BOARD_HOME} />
            <AuthNotice
              body="Your address is confirmed and your account is ready."
              actionHref={BOARD_HOME}
              actionLabel="Continue to your board"
            />
          </>
        )}

        {state === "expired" && (
          <AuthNotice body="Verification links can only be used once. Send yourself a fresh one.">
            <VerifyResend email={email} />
          </AuthNotice>
        )}

        {state === "pending" && (
          <AuthNotice
            body={
              email
                ? `We sent a verification link to ${email}. Open it to activate your account.`
                : "We sent you a verification link. Open it to activate your account."
            }
          >
            <VerifyResend email={email} />
            <p className="text-2xs text-text-subtle">
              Wrong address?{" "}
              <Link href="/sign-up" className="font-semibold text-text-brand">
                Sign up again
              </Link>
            </p>
          </AuthNotice>
        )}
      </AuthColumn>

      <AuthAside variant="verify-email" />
    </>
  );
}
