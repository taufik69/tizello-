import type { PendingInvitation } from "@/types/workspace";

/*
 * Pure ordering for the pending-invitations list, deliberately in its own
 * module with **no imports beyond a type**.
 *
 * `lib/invites.ts` reaches the API through `lib/api-client.ts`, which imports
 * `next/headers` — server-only. `MembersPanel` is a Client Component and needs
 * this one function to re-sort its optimistic state, so importing it from
 * `invites.ts` would pull `next/headers` into the browser bundle and fail the
 * build. Splitting the pure part out is the fix; adding "use client" to
 * `invites.ts` would not be.
 */

/** Newest invitation first — the one most likely to need chasing is on top. */
export function sortInvitations(
  pending: PendingInvitation[],
): PendingInvitation[] {
  return [...pending].sort((a, b) => b.invitedAt.localeCompare(a.invitedAt));
}
