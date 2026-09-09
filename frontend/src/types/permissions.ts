/*
 * The permissions screen's model. Plain data, like `nav.ts` — every shape here
 * is what `GET /workspaces/:id/roles` would return, so swapping the fixture
 * for a fetch is the whole migration.
 *
 * A role holds the ALLOWED ACTION IDS; an action knows nothing about roles.
 * That is what lets a workspace define a role the product has never heard of:
 * the matrix's columns come from the role list, not from a fixed union.
 */

/** The four things a role is scoped over. Matrix row groups, in this order. */
export const PERMISSION_AREAS = [
  "workspace",
  "members",
  "projects",
  "tasks",
] as const;
export type PermissionArea = (typeof PERMISSION_AREAS)[number];

/** One row of the matrix. */
export type PermissionAction = { id: string; label: string };

/** One area's rows, with the heading the matrix groups them under. */
export type PermissionGroup = {
  area: PermissionArea;
  label: string;
  actions: readonly PermissionAction[];
};

export type RoleDefinition = {
  id: string;
  name: string;
  /**
   * The three roles that ship with the product. They are the floor the app is
   * written against, so they can be read but never renamed, re-scoped or
   * deleted; a workspace's own roles can be all three.
   */
  builtIn: boolean;
  /** Action ids from the matrix. An id that is absent is a denial. */
  allowed: readonly string[];
};
