import { AuthAside } from "@/components/auth/auth-aside";
import { AuthColumn } from "@/components/auth/auth-column";
import { AuthNotice } from "@/components/auth/auth-notice";
import { InviteAcceptActions } from "@/components/invite/invite-accept-actions";
import { InviteSignedOut } from "@/components/invite/invite-signed-out";
import { InviteSummary } from "@/components/invite/invite-summary";
import { getInvitation, getSignedInAccount } from "@/lib/demo-invites";

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

export default async function InvitePage({
  params,
  searchParams,
}: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const query = await searchParams;
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
  const account = await getSignedInAccount();

  /* There is no auth in scope on this screen, so the signed-in / signed-out
     split is driven by a query parameter: `?signedIn=0` renders the signed-out
     branch, anything else renders the signed-in one. Both states are therefore
     reachable by hand, which is the point. The real page will read a session. */
  const signedIn = query.signedIn !== "0";

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
