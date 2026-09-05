import { settle } from "@/lib/settle";
import type { PermissionGroup, RoleDefinition } from "@/types/permissions";

/*
 * In-memory stand-in for the permissions API, shaped like `demo-members.ts`:
 * module-level data, the same latency shim, and getters whose signatures match
 * the eventual endpoints (`GET /workspaces/:id/permissions`,
 * `GET /workspaces/:id/roles`).
 *
 * NOTHING HERE IS ENFORCEMENT. It is the table the screen draws — a role the
 * user creates changes this screen and nothing else until the server gates on
 * the same map.
 */

const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    area: "workspace",
    label: "Workspace",
    actions: [
      { id: "workspace.edit", label: "Edit workspace" },
      { id: "workspace.delete", label: "Delete workspace" },
      { id: "workspace.billing", label: "Manage billing" },
    ],
  },
  {
    area: "members",
    label: "Members",
    actions: [
      { id: "members.invite", label: "Invite member" },
      { id: "members.remove", label: "Remove member" },
      { id: "members.roles", label: "Change roles" },
    ],
  },
  {
    area: "projects",
    label: "Projects",
    actions: [
      { id: "projects.create", label: "Create project" },
      { id: "projects.edit", label: "Edit project" },
      { id: "projects.delete", label: "Delete project" },
    ],
  },
  {
    area: "tasks",
    label: "Tasks & board",
    actions: [
      { id: "tasks.create", label: "Create task" },
      { id: "tasks.edit", label: "Edit task" },
      { id: "tasks.delete", label: "Delete task" },
      { id: "tasks.move", label: "Move task" },
      { id: "tasks.sprints", label: "Manage sprints" },
    ],
  },
];

/** Every action id, in matrix order. The Owner's grant, and the picker's list. */
export const ALL_ACTION_IDS: readonly string[] = PERMISSION_GROUPS.flatMap(
  (group) => group.actions.map((action) => action.id),
);

/* Admin runs the workspace but cannot bill or delete it; Member does the work
   on a board and nothing structural. Written as exclusions from the top so a
   new action is denied to Member by default rather than granted by omission. */
const ADMIN_DENIED = ["workspace.delete", "workspace.billing"];
const MEMBER_ALLOWED = [
  "tasks.create",
  "tasks.edit",
  "tasks.delete",
  "tasks.move",
];

/* The ids match `WorkspaceRole`, so a member's stored role is already a role
   id and the roster needs no translation. */
const BUILT_IN_ROLES: readonly RoleDefinition[] = [
  { id: "OWNER", name: "Owner", builtIn: true, allowed: ALL_ACTION_IDS },
  {
    id: "ADMIN",
    name: "Admin",
    builtIn: true,
    allowed: ALL_ACTION_IDS.filter((id) => !ADMIN_DENIED.includes(id)),
  },
  { id: "MEMBER", name: "Member", builtIn: true, allowed: MEMBER_ALLOWED },
];

/* One workspace-defined role in the fixture, so the screen shows what a custom
   role looks like before anyone creates one. */
const DEMO_CUSTOM_ROLES: readonly RoleDefinition[] = [
  {
    id: "role-reviewer",
    name: "Reviewer",
    builtIn: false,
    allowed: ["tasks.edit", "tasks.move", "projects.edit"],
  },
];

export function getPermissionMatrix(
  workspaceId: string,
): Promise<PermissionGroup[]> {
  /* The one matrix stands in for every workspace, so the id only guards the
     empty case here. The real query filters on it. */
  return settle(workspaceId ? [...PERMISSION_GROUPS] : []);
}

export function getWorkspaceRoles(
  workspaceId: string,
): Promise<RoleDefinition[]> {
  return settle(
    workspaceId ? [...BUILT_IN_ROLES, ...DEMO_CUSTOM_ROLES] : [],
  );
}

/** `POST /workspaces/:id/roles` — the shape, without the request. */
export function draftRole(
  name: string,
  allowed: readonly string[],
): RoleDefinition {
  return {
    /* Unique within the session, which is as long as a demo role lives. */
    id: `role-${Date.now().toString(36)}`,
    name: name.trim(),
    builtIn: false,
    allowed: ALL_ACTION_IDS.filter((id) => allowed.includes(id)),
  };
}
