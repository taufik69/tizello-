import type { WorkspaceRole } from "@/types/workspace";
import type { ProjectRole } from "@/types/project";

/*
 * What a caller may do to a project.
 *
 * A MIRROR of the two-layer ladder in
 * `backend/src/shared/middlewares/project.js`, and only ever a mirror: the API
 * re-checks every one of these, so what is below decides which controls are
 * DRAWN, never what is allowed. A stale copy here shows someone a menu item
 * that comes back `403` — annoying, not a hole. Same bargain `lib/roles.ts`
 * strikes for the workspace.
 *
 * THE LADDER (contract §*Guards*), in fixed order:
 *
 *   1. Not a workspace member → the project 404s and never reaches the UI.
 *   2. Workspace OWNER/ADMIN → full access to every project in the workspace,
 *      regardless of project role. This is the escape hatch that stops an
 *      admin being locked out of a project in their own workspace, and it is
 *      why every predicate below takes BOTH roles.
 *   3. Otherwise the project role decides — owner and MANAGER may write.
 *   4. Workspace MEMBER with no project row → read-only. `viewerRole` is
 *      `null` in that case, which is a value, not a missing field.
 */

/** Step 2. The frontend half of the API's `PROJECT_MANAGE_ANY`. */
function managesAnyProject(workspaceRole: WorkspaceRole): boolean {
  return workspaceRole === "OWNER" || workspaceRole === "ADMIN";
}

/**
 * `PATCH /projects/:id`, `/archive`, and every member endpoint except
 * transfer — the API's `requireProjectWrite`.
 */
export function canWriteProject(
  workspaceRole: WorkspaceRole,
  viewerRole: ProjectRole | null,
): boolean {
  return (
    managesAnyProject(workspaceRole) ||
    viewerRole === "OWNER" ||
    viewerRole === "MANAGER"
  );
}

/**
 * `DELETE /projects/:id` and `/transfer-ownership` — the API's
 * `requireProjectOwner`. Deliberately tighter than `canWriteProject`: a
 * MANAGER may edit a project and may not delete or hand it over.
 */
export function canOwnProject(
  workspaceRole: WorkspaceRole,
  viewerRole: ProjectRole | null,
): boolean {
  return managesAnyProject(workspaceRole) || viewerRole === "OWNER";
}

/**
 * Create / rename / delete a custom PROPERTY DEFINITION — the API's
 * `PROJECT_MANAGE_ANY` on `/workspaces/:id/properties`.
 *
 * Deliberately not `canWriteProject`: adding a column changes the shape of
 * every project in the workspace, where filling one in changes one project.
 * A plain MEMBER who owns a project may set its property values and may not
 * invent a new column for everybody.
 */
export function canManageProperties(workspaceRole: WorkspaceRole): boolean {
  return managesAnyProject(workspaceRole);
}

/**
 * `POST /workspaces/:id/projects` — the API's `PROJECT_CREATE`, which every
 * workspace role holds today. Written out anyway rather than hard-coded
 * `true` at the call site: the contract calls the MEMBER grant "a deliberate
 * default", and when it is reversed this is the one line that changes.
 */
export function canCreateProject(workspaceRole: WorkspaceRole): boolean {
  return (
    workspaceRole === "OWNER" ||
    workspaceRole === "ADMIN" ||
    workspaceRole === "MEMBER"
  );
}
