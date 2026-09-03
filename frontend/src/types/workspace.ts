/*
 * Workspace domain types. Mirrors the style of `board.ts`: `as const` literal
 * arrays for anything the UI has to switch on, `type` rather than `interface`,
 * and no `any`.
 */

/** Uppercase because that is how a role arrives from an auth/permissions API. */
export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/**
 * The workspace icon's hue. Reuses the six card-label hues rather than adding a
 * seventh scale — they are primitives, legible on both themes, and decorative
 * only. Never the sole carrier of meaning: the name sits next to the disc.
 */
export const WORKSPACE_ACCENTS = [
  "green",
  "yellow",
  "orange",
  "red",
  "purple",
  "blue",
] as const;
export type WorkspaceAccent = (typeof WORKSPACE_ACCENTS)[number];

export type Project = {
  id: string;
  name: string;
  /** Absent on a project nobody has described yet. */
  description?: string;
  taskCount: number;
};

export type Workspace = {
  id: string;
  name: string;
  memberCount: number;
  /** The CURRENT user's role in this workspace, not the workspace's own. */
  role: WorkspaceRole;
  accent: WorkspaceAccent;
  projects: Project[];
};

export type CurrentUser = {
  id: string;
  name: string;
};
