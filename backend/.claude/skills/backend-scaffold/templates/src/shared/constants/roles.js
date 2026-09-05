// The single source of truth for workspace roles and what each one may do.
// Both the permission middleware (shared/middlewares/permission.js) and any
// service that needs an authorization decision read from here — no module
// hard-codes a role string or an `if (role === 'ADMIN')` check of its own.
//
// The string values must stay in sync with the `Role` enum in
// prisma/schema.prisma: they are written to and read back from Postgres.

const ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
};

// Ordered least → most privileged. Used by `roleAtLeast` below for the
// common "ADMIN or above" style check, where enumerating every permission
// would be noise.
const ROLE_ORDER = [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER];

// Every permission the app can check, as `resource:action`. Add new ones
// here first, then grant them in PERMISSIONS below — a permission that is
// checked but never listed always denies, which is the safe direction.
const PERMISSIONS = {
  WORKSPACE_VIEW: 'workspace:view',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_DELETE: 'workspace:delete',
  MEMBER_VIEW: 'member:view',
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  MEMBER_ROLE_UPDATE: 'member:role:update',
  BILLING_MANAGE: 'billing:manage',
};

// Role → permissions granted. Deliberately written out per role rather than
// derived by inheritance: an explicit table is greppable, and it makes the
// OWNER-only rows (delete the workspace, change roles, billing) obvious at a
// glance instead of implied by position in a hierarchy.
const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.WORKSPACE_UPDATE,
    PERMISSIONS.WORKSPACE_DELETE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_ROLE_UPDATE,
    PERMISSIONS.BILLING_MANAGE,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.WORKSPACE_UPDATE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
  ],
  [ROLES.MEMBER]: [PERMISSIONS.WORKSPACE_VIEW, PERMISSIONS.MEMBER_VIEW],
};

// Does `role` hold `permission`? Unknown roles and unknown permissions both
// return false rather than throwing — an authorization check must fail
// closed, and the caller turns that into a 403.
const hasPermission = (role, permission) => {
  const granted = ROLE_PERMISSIONS[role];
  if (!granted) return false;
  return granted.includes(permission);
};

// True when `role` is at least as privileged as `minimum` on ROLE_ORDER.
const roleAtLeast = (role, minimum) => {
  const roleIndex = ROLE_ORDER.indexOf(role);
  const minimumIndex = ROLE_ORDER.indexOf(minimum);
  if (roleIndex === -1 || minimumIndex === -1) return false;
  return roleIndex >= minimumIndex;
};

export { ROLES, ROLE_ORDER, PERMISSIONS, ROLE_PERMISSIONS, hasPermission, roleAtLeast };
export default ROLES;
