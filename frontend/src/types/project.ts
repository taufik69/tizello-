import type { ProjectPropertyValues } from "@/types/project-property";

/*
 * The project domain, mirroring `backend/docs/api/project.md`.
 *
 * WHY THIS IS NOT `Project` FROM `workspace.ts`
 * ---------------------------------------------
 * `workspace.ts` already exports `Project` (`{ id, name, description?,
 * taskCount }`). That one is the *summary tile* rendered by `ProjectCard` on
 * the workspace detail page, and it is still fixture-shaped — nothing computes
 * `taskCount` (the API's `taskCounter` is schema-only, contract §*divergence
 * 3*). This file holds the *record*: the row the API actually returns.
 *
 * Uppercase members, matching `WorkspaceRole` — that is how an enum arrives
 * from an API, and it keeps the display string a UI concern.
 */

/*
 * Canonical order: how far along a project is. Board columns and the status
 * breakdown both render in this order, so it is the single source of it.
 *
 * These are the API's six values verbatim (contract §*Three independent
 * axes*), which is a change from the fixture set they replaced — `TODO`,
 * `IN_PROGRESS`, `PAUSED` and `COMPLETE` never existed on the server.
 *
 * **There is no `ARCHIVED` member, deliberately.** Archiving is `isArchived`,
 * a separate axis; a status that could disagree with it is exactly what the
 * contract removed.
 */
export const PROJECT_STATUSES = [
  "BACKLOG",
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Most urgent first. Four values, not three — the API added `URGENT`. */
export const PROJECT_PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

/**
 * A project role. `OWNER` is never assignable through the member endpoints —
 * ownership moves through transfer alone (contract §§8–9, 11) — which is what
 * `ASSIGNABLE_PROJECT_ROLES` below is for.
 */
export const PROJECT_ROLES = ["OWNER", "MANAGER", "COLLABORATOR"] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const ASSIGNABLE_PROJECT_ROLES = ["MANAGER", "COLLABORATOR"] as const;
export type AssignableProjectRole = (typeof ASSIGNABLE_PROJECT_ROLES)[number];

/**
 * A person as a project cell shows them: an id to key on and a name to draw
 * initials from. No `avatarUrl` — nothing in this app has an image source.
 */
export type ProjectPerson = {
  id: string;
  name: string;
};

/**
 * One project, exactly as `GET /projects/:id` returns it.
 *
 * `id` is the cuid — the thing every URL and mutation is addressed by.
 * `key` is the human prefix (`"TIZ"`), which is what the ID column shows and
 * what `?q=` searches alongside the name. They are two fields because the API
 * has two, and the old fixture conflated them into one `"TIZ-3"` string.
 *
 * `viewerRole` is the CALLER's effective role in this project, not a field of
 * the project (contract §`viewerRole`). `null` means a workspace member who is
 * not on the project — read-only.
 *
 * `ownerId` is authoritative for ownership; `owner` is the resolved person and
 * is present ONLY where a member call has happened, because the list endpoint
 * returns ids and no names. See `lib/projects.ts` §*The owner gap*.
 */
export type ProjectRecord = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  icon: string | null;
  color: string | null;
  /** ISO 8601, or null on a project filed but not scheduled — the timeline has to survive that rather than place a bar at NaN. */
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
  workspaceId: string;
  ownerId: string;
  viewerRole: ProjectRole | null;
  createdAt: string;
  updatedAt: string;
  /**
   * Values for the workspace's user-defined properties, keyed by definition id
   * — see `types/project-property.ts`. Already filtered by the API to
   * definitions that still exist, so a key here always has a definition to
   * render it with. `{}` on a project that has set none.
   */
  properties: ProjectPropertyValues;

  /** Resolved from a members call; absent on anything the list endpoint returned. */
  owner?: ProjectPerson;
  /** Everyone but the owner. Empty until a members call populates it. */
  collaborators?: ProjectPerson[];
};

/** One row of `GET /projects/:id/members`. */
export type ProjectMemberRecord = {
  id: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  /** Whitelisted to three fields at the API's own query — never a route to a password hash. */
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
};

/**
 * The five views, and the only accepted values of `?view=`. Anything else
 * falls back to the first entry — see `parseProjectView`.
 */
export const PROJECT_VIEWS = [
  "active",
  "timeline",
  "board",
  "all",
  "status",
] as const;
export type ProjectView = (typeof PROJECT_VIEWS)[number];

/** Shaped like `WorkspaceFormState` for the same reason: one serialisable result whatever happened. */
export type ProjectFormState = {
  code?: string;
  fieldErrors?: Record<string, string>;
  done?: boolean;
  /**
   * The new project's id, on a successful CREATE only.
   *
   * The create drawer stages collaborators while there is nothing to attach
   * them to, and `POST /workspaces/:id/projects` accepts no member list — so
   * the id has to come back for the follow-up `POST /projects/:id/members` to
   * have an address. Absent on update, which already knows the id.
   */
  projectId?: string;
};

/**
 * Copy for the `code`s `lib/projects.ts` can return. Not a closed union — the
 * project API's failures are generic HTTP-ish codes.
 *
 * `CONFLICT` carries two meanings the UI has to keep apart, so its copy names
 * neither: a supplied `key` already taken (§1) and a member endpoint aimed at
 * the owner (§§9–10). Call sites that know which one they triggered pass their
 * own sentence.
 */
export const PROJECT_ERROR_COPY: Record<string, string> = {
  VALIDATION_ERROR: "Check the fields below.",
  UNAUTHORIZED: "Your session expired. Sign in again.",
  TOKEN_EXPIRED: "Your session expired. Sign in again.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "That project is no longer available.",
  CONFLICT: "That change conflicts with the project's current state.",
  RATE_LIMITED: "Too many attempts. Try again in a few minutes.",
  SERVER_ERROR: "Something went wrong. Try again.",
};

/** Display names. One map, because three screens render a status. */
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  BACKLOG: "Backlog",
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PROJECT_PRIORITY_LABEL: Record<ProjectPriority, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  COLLABORATOR: "Collaborator",
};
