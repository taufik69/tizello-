/**
 * Row -> response shaping for projects and their members. A whitelist, like
 * `workspace.dto.js` — never a `delete row.field` blacklist, so a column added
 * to the model later cannot leak by default.
 *
 * `properties` is the one field that is not a straight column read — see
 * `liveProperties` below.
 *
 * Two fields are deliberately absent from `toProject`:
 *
 * - `taskCounter` exists on the row today (schema-only, ahead of the Task
 *   module) but nothing in this module reads or writes it, and this DTO is what
 *   keeps it out of every response until a task contract says otherwise. Same
 *   arrangement as the workspace module's billing columns.
 * - `deletedAt` is never surfaced: every read already filters it out, so a
 *   client that could see it would be seeing a row it cannot act on.
 *
 * `viewerRole` is a parameter, not a column: it is the caller's own effective
 * role in this project — OWNER when they own it, otherwise their
 * `ProjectMember` role, otherwise null — stamped on per response so a client
 * knows what it may do without a second call.
 *
 * See docs/api/project.md
 */

/**
 * `definitions` is the workspace's live property list. Values whose definition
 * has been deleted are dropped HERE rather than in the database: deleting a
 * property is then one row rather than a rewrite of every project that ever
 * used it, and the orphan is invisible either way (plan §2.4).
 *
 * Omit `definitions` and `properties` comes back `{}` — which is what every
 * caller that has not loaded the schema should see, rather than a map of
 * opaque ids it cannot render.
 */
const liveProperties = (stored, definitions) => {
  if (!stored || !definitions) return {};

  const live = new Set(definitions.map((definition) => definition.id));

  return Object.fromEntries(
    Object.entries(stored).filter(([id]) => live.has(id))
  );
};

const toProject = (row, viewerRole = null, definitions = null) => ({
  id: row.id,
  name: row.name,
  key: row.key,
  description: row.description,
  status: row.status,
  priority: row.priority,
  icon: row.icon,
  color: row.color,
  startDate: row.startDate,
  endDate: row.endDate,
  isArchived: row.isArchived,
  workspaceId: row.workspaceId,
  ownerId: row.ownerId,
  viewerRole,
  properties: liveProperties(row.properties, definitions),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * `user` is nested only when the row was loaded with it, and is whitelisted
 * down to three fields — a member list must never be a route to
 * `passwordHash` or `emailVerifiedAt`.
 */
const toProjectMember = (row) => ({
  id: row.id,
  userId: row.userId,
  role: row.role,
  createdAt: row.createdAt,
  ...(row.user
    ? { user: { id: row.user.id, name: row.user.name, email: row.user.email } }
    : {}),
});

export { toProject, toProjectMember };
export default { toProject, toProjectMember };
