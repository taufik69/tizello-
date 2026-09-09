import { redirect } from "next/navigation";
import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFooter } from "@/components/auth/auth-footer";
import { SignInForm } from "@/components/auth/sign-in-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import { getSession } from "@/lib/auth";
import { HOME } from "@/lib/session-cookie";
import { safeNextPath } from "@/lib/validation/auth";

export const metadata = {
  title: "Log in",
  description: "Log in to Tizello with a login code or your password.",
};

export default async function SignInPage({ searchParams }: PageProps<"/sign-in">) {
  const { next, reset } = await searchParams;
  const target = safeNextPath(typeof next === "string" ? next : undefined);

  if (await getSession()) redirect(target ?? HOME);

  return (
    <>
      <AuthColumn
        heading="Log in to Tizello"
        sub="Enter your email to continue."
      >
        {reset === "1" && (
          <p
            role="status"
            className="mb-4 rounded-sm border border-success bg-success-subtle px-3 py-2 text-2xs text-text"
          >
            Password updated. Log in with your new password.
          </p>
        )}

        <SignInForm next={target ?? undefined} />
        <AuthDivider label="or continue with" />
        <SocialButtons next={target ?? undefined} />

        {/* `next` rides across to sign-up. Dropping it here breaks the invite
            path specifically: an invited recipient has no account, so this is
            the link they take, and `/sign-up` needs `?next=/invite/<token>` to
            find the token that lets registration double as accepting. */}
        <AuthFooter
          prompt="New to Tizello?"
          href={target ? `/sign-up?next=${encodeURIComponent(target)}` : "/sign-up"}
          label="Create an account"
          secondaryHref="/forgot-password"
          secondaryLabel="Can&rsquo;t log in?"
        />
      </AuthColumn>

      <AuthAside variant="sign-in" />
    </>
  );
}
