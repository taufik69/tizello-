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
