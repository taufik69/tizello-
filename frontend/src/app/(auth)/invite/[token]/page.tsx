import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthNotice } from "@/components/auth/auth-notice";
import { InviteAcceptActions } from "@/components/invite/invite-accept-actions";
import { InviteSignedOut } from "@/components/invite/invite-signed-out";
import { InviteSummary } from "@/components/invite/invite-summary";
import { getInvitation } from "@/lib/invites";
import { getSession } from "@/lib/auth";

/*
 * Inside the `(auth)` route group, so this still serves `/invite/[token]` — a
 * route group does not appear in the URL — and inherits the two-panel split
 * shell from `(auth)/layout.tsx` for free. `verify-email` is the precedent: a
 * token-driven landing page that resolves its token on the server rather than
 * flickering through a "checking…" state in an effect.
 *
 * Exactly one `<h1>`, rendered by `AuthColumn` via `AuthHeader`. The aside
 * contributes no heading.
 */

export async function generateMetadata({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const lookup = await getInvitation(token);

  if (lookup.status !== "VALID") {
    return {
      title: "Invitation unavailable",
      description: "This invitation link is no longer valid.",
    };
  }

  const { workspaceName, invitedByName } = lookup.invitation;
  return {
    title: `Join ${workspaceName}`,
    description: `${invitedByName} invited you to the ${workspaceName} workspace on Tizello.`,
  };
}

const DEAD_LINK = {
  EXPIRED: {
    heading: "This invitation has expired.",
    sub: "Invitation links last seven days.",
    body: "Ask whoever invited you to send a fresh one — the old link cannot be revived.",
  },
  UNKNOWN: {
    heading: "We cannot find that invitation.",
    sub: "The link may be mistyped, cancelled, or already used.",
    body: "Check you copied the whole link, then ask whoever invited you to send another.",
  },
} as const;

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const lookup = await getInvitation(token);

  /* A dead token renders a state, not an empty shell. It is a page rather than
     `notFound()` because "expired" and "never existed" want different copy and
     the same reassurance, which the 404 route cannot give. */
  if (lookup.status !== "VALID") {
    const { heading, sub, body } = DEAD_LINK[lookup.status];
    return (
      <>
        <AuthColumn heading={heading} sub={sub}>
          <AuthNotice body={body} actionHref="/sign-in" actionLabel="Go to sign in" />
        </AuthColumn>
        <AuthAside variant="invite" />
      </>
    );
  }

  const { invitation } = lookup;
  /* The real signed-in account, not a fixture. Null when nobody is signed in —
     which is the common case here: whoever followed an invitation link usually
     has no account yet, and the screen sends them to sign up. */
  const account = await getSession();

  /* The session decides now, not a query parameter. `?signedIn=0` used to
     drive this split so both branches were reachable by hand while there was no
     auth to read; leaving it in place would let anyone force the signed-out
     branch on a real session, which is confusing rather than dangerous — but it
     is also a URL that no longer means anything. */
  const signedIn = account !== null;

  return (
    <>
      <AuthColumn
        heading={`Join ${invitation.workspaceName}`}
        sub={`${invitation.invitedByName} invited you to collaborate.`}
      >
        <InviteSummary invitation={invitation} />

        {signedIn ? (
          <InviteAcceptActions
            accountEmail={account.email}
            workspaceId={invitation.workspaceId}
            workspaceName={invitation.workspaceName}
          />
        ) : (
          <InviteSignedOut
            token={invitation.token}
            workspaceName={invitation.workspaceName}
          />
        )}
      </AuthColumn>

      <AuthAside variant="invite" />
    </>
  );
}
