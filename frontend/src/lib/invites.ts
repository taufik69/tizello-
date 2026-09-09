import { apiCall, apiCallWithRefresh } from "@/lib/api-client";
import { sortInvitations } from "@/lib/invite-sort";
import type {
  InvitationLookup,
  InvitableRole,
  PendingInvitation,
  WorkspaceInvitation,
} from "@/types/workspace";

export { sortInvitations };

/*
 * The invitations API — `GET /workspaces/:id/invitations` and
 * `GET /invitations/:token`, plus the accept/decline/revoke writes.
 *
 * Replaces `demo-invites.ts`, keeping the same function signatures so the
 * migration was confined to this file and its import sites.
 *
 * **The three dead states stay collapsed.** The API answers 404 for revoked,
 * declined, already-accepted and never-existed alike, and this file maps all of
 * them to `UNKNOWN` rather than inventing a fourth state — the shipped copy for
 * `UNKNOWN` already reads "mistyped, cancelled, or already used", and
 * distinguishing them would tell a token-guesser that a token was once real.
 * Only 410 becomes `EXPIRED`, because that is the one recoverable case.
 */

type ApiInvitation = {
  id: string;
  email: string;
  role: InvitableRole;
  status: "PENDING";
  invitedByName: string | null;
  expiresAt: string;
  createdAt: string;
};

export async function getPendingInvitations(
  workspaceId: string,
): Promise<PendingInvitation[]> {
  if (!workspaceId) return [];

  const result = await apiCallWithRefresh<{ invitations: ApiInvitation[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/invitations`,
  );

  if (!result.ok) return [];

  return sortInvitations(
    result.data.invitations.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      /* The list type calls it `invitedAt`; the API calls it `createdAt`. Same
         instant, and both are ISO 8601 UTC strings so they cross the RSC
         boundary and format identically on server and client. */
      invitedAt: row.createdAt,
      status: "PENDING" as const,
    })),
  );
}

/**
 * `GET /invitations/:token`. Unauthenticated — the recipient has no account
 * yet, which is the entire situation this endpoint exists for.
 */
export async function getInvitation(token: string): Promise<InvitationLookup> {
  const result = await apiCall<{ invitation: WorkspaceInvitation }>(
    `/invitations/${encodeURIComponent(token)}`,
  );

  if (result.ok) {
    return { status: "VALID", invitation: result.data.invitation };
  }

  return result.status === 410 ? { status: "EXPIRED" } : { status: "UNKNOWN" };
}

/** `POST /workspaces/:id/invitations`. */
export async function createInvitation(input: {
  workspaceId: string;
  email: string;
  role: InvitableRole;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const result = await apiCallWithRefresh(
    `/workspaces/${encodeURIComponent(input.workspaceId)}/invitations`,
    { method: "POST", body: { email: input.email, role: input.role } },
  );

  return result.ok ? { ok: true } : { ok: false, code: result.code };
}

/**
 * `DELETE /workspaces/:id/invitations/:id` — revoke.
 *
 * The row is not deleted server-side; it is marked revoked and keeps its audit
 * trail. From here it is simply gone, which is why nothing comes back.
 */
export async function revokeInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<boolean> {
  const result = await apiCallWithRefresh(
    `/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
  );

  return result.ok;
}

/** `POST .../invitations/:id/resend`. Rotates the token; the old link dies. */
export async function resendInvitation(
  workspaceId: string,
  invitationId: string,
): Promise<boolean> {
  const result = await apiCallWithRefresh(
    `/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST" },
  );

  return result.ok;
}

/**
 * `POST /invitations/:token/accept`.
 *
 * Idempotent server-side: accepting twice returns 200 both times with one
 * membership row, so a double-clicked button is not an error state here either.
 */
export async function acceptInvitation(
  token: string,
): Promise<{ ok: true; workspaceId: string } | { ok: false; code: string }> {
  const result = await apiCallWithRefresh<{ workspaceId: string }>(
    `/invitations/${encodeURIComponent(token)}/accept`,
    { method: "POST" },
  );

  return result.ok
    ? { ok: true, workspaceId: result.data.workspaceId }
    : { ok: false, code: result.code };
}

/** `POST /invitations/:token/decline`. */
export async function declineInvitation(token: string): Promise<boolean> {
  const result = await apiCallWithRefresh(
    `/invitations/${encodeURIComponent(token)}/decline`,
    { method: "POST" },
  );

  return result.ok;
}
