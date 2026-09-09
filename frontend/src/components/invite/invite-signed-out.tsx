import Link from "next/link";
import { AUTH_BUTTON } from "@/components/auth/auth-submit";

/* Matches `InviteAcceptActions`' Decline button — the same secondary treatment
   this screen already uses one branch over. */
const SECONDARY =
  "h-10 w-full rounded-sm border border-border bg-surface text-sm font-semibold text-text transition-colors duration-100 ease-standard hover:bg-surface-hover";

/*
 * The signed-out branch. There is no account to attach the invitation to yet,
 * so the only actions are the two routes to one.
 *
 * The invite travels forward as `next`, so signing in or signing up returns to
 * this page rather than dropping someone on a board with no idea what they
 * just agreed to. `/sign-in` reads that parameter back through `safeNextPath`,
 * which requires a relative path — this is one.
 *
 * **Sign up is the primary action, not sign in.** An invitation is addressed to
 * an email, and the ordinary reason to send one is that the recipient is not on
 * Tizello yet — so the button that used to read "Sign in to accept" asked most
 * people for a password they had never set. Signing up with this token attached
 * is also the shorter path: `/sign-up?next=/invite/<token>` hands the token to
 * `register()`, which returns a verified account and a session in one call, so
 * there is no verification code and no second trip back to this screen.
 *
 * **Both routes are real buttons, and the screen does not guess between them.**
 * The public lookup deliberately withholds the invited address (a token-guesser
 * must not learn who was invited), so this page cannot know whether an account
 * exists — and asking the API would be the enumeration oracle the whole auth
 * flow is built to avoid. Sign up leads because it is the commoner case and the
 * shorter path; log in sits beside it at secondary weight rather than buried in
 * the footer, because the recipient who does have an account is not rare enough
 * to make hunt for it.
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
    <div className="mt-6 space-y-3">
      <Link
        href={`/sign-up?next=${next}`}
        className={`${AUTH_BUTTON} flex items-center justify-center`}
      >
        Create an account to join
      </Link>

      <Link
        href={`/sign-in?next=${next}`}
        className={`${SECONDARY} flex items-center justify-center`}
      >
        I already have an account
      </Link>

      <p className="text-center text-2xs text-text-subtle">
        Use the address this invitation was sent to — it joins you to{" "}
        {workspaceName} straight away, with no confirmation code.
      </p>
    </div>
  );
}
