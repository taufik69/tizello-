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

/**
 * One person's membership of one workspace — the `Member` row of the Prisma
 * reference in `.claude/plan/applicaton-flow.md`, flattened with the `User`
 * fields the roster screen renders.
 *
 * Named `WorkspaceMember` because `board.ts` already exports a `Member`: that
 * one is a card assignee (id + name only) and the two must not be conflated.
 *
 * `id` is the membership; `userId` is the person, and is what identifies the
 * signed-in user's own row. There is no avatar field: nothing in this app has
 * an image source, so the discs are initials and a never-rendered `avatarUrl`
 * would be dead weight.
 */
export type WorkspaceMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
};

/** Ownership is transferred, never granted by invitation. */
export const INVITABLE_ROLES = ["ADMIN", "MEMBER"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

/**
 * An invitation that has been sent and not yet accepted.
 *
 * Deliberately NOT a `WorkspaceMember`: nobody has accepted, so there is no
 * user id, no name and nothing to draw an avatar from. The address it was sent
 * to is the whole identity, which is why the pending row leads with it.
 *
 * `invitedAt` is an ISO 8601 string rather than a `Date`. It is rendered
 * through `formatDate` with a pinned locale and time zone, so the server and
 * the browser cannot produce different text and trip a hydration mismatch.
 */
export type PendingInvitation = {
  id: string;
  email: string;
  role: InvitableRole;
  invitedAt: string;
  /** One value today. Declined and expired invitations are a later screen. */
  status: "PENDING";
};

/** What the accept screen shows someone who followed an invitation link. */
export type WorkspaceInvitation = {
  token: string;
  workspaceId: string;
  workspaceName: string;
  invitedByName: string;
  role: InvitableRole;
};

/**
 * The result of resolving an invitation token — the three responses the
 * eventual `GET /invitations/:token` has to distinguish: 200, 410 Gone for a
 * link that has aged out, 404 for one that never existed or has been consumed.
 */
export type InvitationLookup =
  | { status: "VALID"; invitation: WorkspaceInvitation }
  | { status: "EXPIRED" }
  | { status: "UNKNOWN" };
