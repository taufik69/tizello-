/**
 * Row → response shaping for workspaces. A whitelist, like `auth.dto.js` —
 * never a `delete row.field` blacklist, so a column added to the model later
 * cannot leak by default.
 *
 * `plan` / `planExpiresAt` / `seatLimit` / `lastPaymentAt` are deliberately
 * absent. They exist on the row today (schema-only, ahead of the SSLCommerz
 * work) but no endpoint in this module reads or writes them, and this DTO is
 * what keeps them out of every response until a billing contract says
 * otherwise — see docs/api/workspace.md's sibling-contract-check §2.
 *
 * `role` is a parameter, not a column: it is the caller's own membership role
 * in this workspace, stamped on per response so a client knows what it may
 * do without a second call.
 *
 * See docs/api/workspace.md
 */

const toWorkspace = (row, role) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  icon: row.icon,
  color: row.color,
  isArchived: row.isArchived,
  role,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * One `Membership` row as the roster shows it.
 *
 * `id` is the membership, `userId` is the person — and `userId` is what every
 * other endpoint takes (adding a project member, transferring ownership), so a
 * client that confuses the two gets a 404 rather than silent nonsense.
 */
const toWorkspaceMember = (row) => ({
  id: row.id,
  userId: row.userId,
  role: row.role,
  createdAt: row.createdAt,
  ...(row.user
    ? { user: { id: row.user.id, name: row.user.name, email: row.user.email } }
    : {}),
});

export { toWorkspace, toWorkspaceMember };
export default { toWorkspace, toWorkspaceMember };
