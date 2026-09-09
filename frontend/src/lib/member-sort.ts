import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/*
 * Roster ordering, as a plain module — the counterpart to `invite-sort.ts`.
 *
 * It lived in `demo-members.ts` until the member API landed. A pure comparator
 * has nothing to do with fixtures, and leaving it there would have kept a
 * deleted fixture file alive as an import target for real code.
 *
 * **The API already returns this order** (`member.md` §1 — `role` then
 * `createdAt`, most-privileged first, because Postgres orders an enum by
 * declaration order). This exists for the client-side re-sort after a role
 * change, where waiting for a refetch to move the row would show the roster in
 * an order that contradicts the chip the user just set.
 */

const ROLE_RANK: Record<WorkspaceRole, number> = {
  OWNER: 0,
  ADMIN: 1,
  MEMBER: 2,
};

/**
 * Returns a new array — the roster is re-sorted after a role change, and
 * mutating the caller's state in place would not re-render.
 *
 * Alphabetical within a role, unlike the API's `createdAt`: the server's
 * secondary key is stable for a list nobody is editing, and a name is what a
 * reader scans for when the row they just changed jumps.
 */
export function sortMembers(roster: WorkspaceMember[]): WorkspaceMember[] {
  return [...roster].sort(
    (a, b) =>
      ROLE_RANK[a.role] - ROLE_RANK[b.role] || a.name.localeCompare(b.name),
  );
}
