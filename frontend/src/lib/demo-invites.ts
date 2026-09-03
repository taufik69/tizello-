import { settle } from "@/lib/settle";
import type {
  InvitationLookup,
  PendingInvitation,
  WorkspaceInvitation,
} from "@/types/workspace";

/*
 * In-memory stand-in for the invitations API, shaped like `demo-members.ts`:
 * module-level arrays, the same latency shim, and getter signatures matching
 * the eventual endpoints — `GET /workspaces/:id/invitations` and
 * `GET /invitations/:token` — so swapping the bodies for real queries is the
 * whole migration.
 *
 * It is a separate module rather than more of `demo-members.ts` for two
 * reasons: that file is already at 90 lines and would cross the 150-line cap,
 * and a roster and its outstanding invitations are two endpoints, not one.
 *
 * Every address here is invented and every domain is non-routable (`.test` is
 * reserved by RFC 2606, `example.com` by RFC 6761). Nothing in this file may
 * ever resemble a real person or a credential.
 */

/* Dates are ISO 8601 UTC strings, never `Date` objects: they cross the RSC
   boundary as props and are formatted by `formatDate`, which pins the locale
   and the zone so server and client render the same characters. */
const invitations: PendingInvitation[] = [
  {
    id: "inv-dara",
    email: "dara.oyelaran@northwind.test",
    role: "ADMIN",
    invitedAt: "2026-08-21T09:12:00.000Z",
    status: "PENDING",
  },
  {
    /* The longest address the row should tolerate — a subdomain on top of a
       hyphenated surname. It has to truncate rather than push the badges and
       the menu off a 360px screen. */
    id: "inv-konstantin",
    email: "konstantin.abernathy-whitfield@procurement.northwind.test",
    role: "MEMBER",
    invitedAt: "2026-08-28T16:40:00.000Z",
    status: "PENDING",
  },
  {
    /* A second domain, a one-word local part, and the oldest of the three:
       the shortest row the list has to lay out next to the longest. */
    id: "inv-noor",
    email: "noor@example.com",
    role: "MEMBER",
    invitedAt: "2026-07-30T07:05:00.000Z",
    status: "PENDING",
  },
];

/**
 * The invitation behind the accept screen. The inviter is the ADMIN from the
 * roster in `demo-members.ts`, and the workspace id is `northwind-studio` from
 * `demo-data.ts`, so accepting can link somewhere that actually exists.
 */
const invitation: WorkspaceInvitation = {
  token: "demo",
  workspaceId: "northwind-studio",
  workspaceName: "Northwind Studio",
  invitedByName: "Marisol Okonkwo-Vandenberg",
  role: "MEMBER",
};

/**
 * The account the accept screen is "signed in as". Deliberately not `u-me`
 * from `demo-data.ts`: someone accepting an invitation is by definition not
 * yet a member of the workspace.
 */
const signedInAccount = {
  name: "Ivo Brandão",
  email: "ivo.brandao@example.com",
};

/** Newest invitation first — the one most likely to need chasing is on top. */
export function sortInvitations(
  pending: PendingInvitation[],
): PendingInvitation[] {
  return [...pending].sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
}

export function getPendingInvitations(
  workspaceId: string,
): Promise<PendingInvitation[]> {
  /* One set of invitations stands in for every workspace, so the id only
     guards the empty case here. The real query filters on it. */
  return settle(workspaceId ? sortInvitations(invitations) : []);
}

/**
 * `GET /invitations/:token`. There is no token store to look anything up in,
 * so two literals stand in for the failure paths: `/invite/expired` renders
 * the aged-out state and `/invite/unknown` the not-found one. Every other
 * token resolves, which is what makes the happy path reachable by hand.
 */
export function getInvitation(token: string): Promise<InvitationLookup> {
  if (token === "expired") return settle<InvitationLookup>({ status: "EXPIRED" });
  if (token === "unknown") return settle<InvitationLookup>({ status: "UNKNOWN" });

  return settle<InvitationLookup>({
    status: "VALID",
    invitation: { ...invitation, token },
  });
}

export function getSignedInAccount(): Promise<{
  name: string;
  email: string;
}> {
  return settle(signedInAccount);
}
