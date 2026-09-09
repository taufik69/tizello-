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

/*
 * `toWorkspaceMember` lived here and is now `toMember` in
 * `src/modules/member/member.dto.js`, unchanged. The roster's writes live in
 * that module, and one response shape cannot have two owners.
 */

export { toWorkspace };
export default { toWorkspace };
