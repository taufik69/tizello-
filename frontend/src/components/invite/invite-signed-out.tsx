import Link from "next/link";
import { AuthFooter } from "@/components/auth/auth-footer";
import { AUTH_BUTTON } from "@/components/auth/auth-submit";

/*
 * The signed-out branch. There is no account to attach the invitation to yet,
 * so the only actions are the two routes to one.
 *
 * The invite travels forward as `next`, so signing in or signing up returns to
 * this page rather than dropping someone on a board with no idea what they
 * just agreed to. `/sign-in` reads that parameter back through `safeNextPath`,
 * which requires a relative path — this is one.
 *
 * Nothing here is wired to real auth; the destinations are the existing auth
 * routes and no session is created by arriving at them.
 */
export function InviteSignedOut({
  token,
  workspaceName,
}: {
  token: string;
  workspaceName: string;
}) {
  const next = encodeURIComponent(`/invite/${token}`);

  return (
    <div className="mt-6">
      <Link
        href={`/sign-in?next=${next}`}
        className={`${AUTH_BUTTON} flex items-center justify-center`}
      >
        Sign in to accept
      </Link>

      <p className="mt-3 text-center text-2xs text-text-subtle">
        You need a Tizello account before you can join {workspaceName}. The
        invitation waits until you have one.
      </p>

      <AuthFooter
        prompt="New here?"
        href={`/sign-up?next=${next}`}
        label="Create an account"
      />
    </div>
  );
}
