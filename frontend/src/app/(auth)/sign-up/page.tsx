import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { SocialButtons } from "@/components/auth/social-buttons";
import { getSession } from "@/lib/auth";
import { BOARD_HOME } from "@/lib/session-cookie";
import { safeNextPath } from "@/lib/validation/auth";

export const metadata = {
  title: "Sign up",
  description: "Create a Tizello account — boards, lists and cards for your team.",
};

export default async function SignUpPage({ searchParams }: PageProps<"/sign-up">) {
  const { next } = await searchParams;
  const target = safeNextPath(typeof next === "string" ? next : undefined);

  /* Reverse guard: an existing session has no business on this screen. */
  if (await getSession()) redirect(target ?? BOARD_HOME);

  return (
    <>
      <AuthColumn
        heading="Sign up for Tizello"
        sub="Free forever for your first 10 boards."
      >
        <SignUpForm />
        <AuthDivider label="or continue with" />
        <SocialButtons next={target ?? undefined} />

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-text-brand">
            Log in
          </Link>
        </p>
      </AuthColumn>

      <AuthAside variant="sign-up" />
    </>
  );
}
