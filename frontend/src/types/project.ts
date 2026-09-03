/*
 * The full project record — the row behind the five views at
 * `/workspaces/[workspaceId]/projects`.
 *
 * WHY THIS IS NOT `Project` FROM `workspace.ts`
 * ---------------------------------------------
 * `workspace.ts` already exports `Project` (`{ id, name, description?,
 * taskCount }`). That one is the *summary tile* rendered by `ProjectCard` on
 * the workspace detail page: three fields, none of which a Projects table
 * column needs. This one is the *record*: status, owner, collaborators, a date
 * range, priority and creation metadata.
 *
 * They are deliberately two types rather than one optional-heavy union. The
 * tile must not gain eight fields it never reads, and the record must not
 * pretend `taskCount` is authoritative when nothing computes it yet. When a
 * real API lands, `Project` becomes a projection of `ProjectRecord` and the
 * workspace page keeps its narrow prop.
 *
 * Uppercase members, matching `WorkspaceRole` — that is how an enum arrives
 * from an API, and it keeps the display string a UI concern rather than a
 * stored one.
 */

/** Canonical order: how far along a project is. Board columns and the status
 *  breakdown both render in this order, so it is the single source of it. */
export const PROJECT_STATUSES = [
  "BACKLOG",
  "TODO",
  "PLANNING",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETE",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Most urgent first. */
export const PROJECT_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

/**
 * A person as a project cell shows them: an id to key on and a name to draw
 * initials from. No `avatarUrl` — nothing in this app has an image source, and
 * `Avatar` has no image part on purpose.
 */
export type ProjectPerson = {
  id: string;
  name: string;
};

export type ProjectRecord = {
  /** The human key shown in the ID column — `"TIZ-3"`, not a UUID. */
  id: string;
  name: string;
  status: ProjectStatus;
  owner: ProjectPerson;
  /** Empty on a project nobody else has been added to. */
  collaborators: ProjectPerson[];
  /**
   * ISO 8601. Both absent on a project that has been filed but not scheduled —
   * the timeline has to survive that rather than place a bar at NaN.
   */
  startDate?: string;
  endDate?: string;
  priority: ProjectPriority;
  createdBy: ProjectPerson;
  createdTime: string;
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
