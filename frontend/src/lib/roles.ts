import type { WorkspaceRole } from "@/types/workspace";

/**
 * The human name for a role. Lives in `lib/` rather than beside `RoleBadge`
 * because three screens now render it — the badge, the permissions matrix
 * header and the confirmation after a role change — and three copies of the
 * same map is three places for "Admin" to become "Administrator".
 */
export const ROLE_LABEL: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

/*
 * What a role may do to the workspace itself.
 *
 * A MIRROR of `ROLE_PERMISSIONS` in `backend/src/shared/constants/roles.js`,
 * and only ever a mirror: the API re-checks every one of these in
 * `requirePermission`, so what is below decides which controls are DRAWN, never
 * what is allowed. A stale copy here shows someone a menu item that comes back
 * `403` — annoying, not a hole.
 *
 * Deliberately two named predicates rather than a `hasPermission(role, string)`
 * port: the frontend gates exactly two actions, and a stringly-typed lookup
 * would let a typo silently fail open at the call site.
 */

/** `PATCH /workspaces/:id` and `/archive` — `WORKSPACE_UPDATE`, OWNER and ADMIN. */
export function canUpdateWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** `DELETE /workspaces/:id` — `WORKSPACE_DELETE`, OWNER only. */
export function canDeleteWorkspace(role: WorkspaceRole): boolean {
  return role === "OWNER";
}
