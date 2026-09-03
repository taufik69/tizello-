import type { LabelColor } from "@/types/board";
import type { ProjectPerson, ProjectPriority } from "@/types/project";

/*
 * The backlog of ONE project — the container `.claude/rules/workflow.md` puts
 * before sprint planning. A task sits in exactly one place, so `sprintId` is
 * the whole membership test: `null` means "still in the backlog", and planning
 * is the operation that fills it in.
 *
 * Priority is `ProjectPriority`, not a second three-member enum: the chip that
 * renders it is `ProjectPriorityBadge`, and two enums meaning the same thing
 * would drift the moment one of them gained a member.
 *
 * A person is `ProjectPerson` for the same reason — the ids match
 * `demo-members.ts`, so the roster, the projects table and this list all agree
 * about who is who.
 */

/** A tag on a task. The colour is decoration; the name carries the meaning. */
export type BacklogLabel = {
  id: string;
  name: string;
  color: LabelColor;
};

/**
 * The tags this workspace offers, in the order the editor lists them. A fixed
 * catalogue rather than free text: the picker needs something to pick from,
 * and a real API would return exactly this shape from
 * `GET /workspaces/:id/labels`.
 */
export const BACKLOG_LABELS = [
  { id: "l-design", name: "Design", color: "purple" },
  { id: "l-frontend", name: "Frontend", color: "blue" },
  { id: "l-api", name: "API", color: "green" },
  { id: "l-content", name: "Content", color: "orange" },
  { id: "l-a11y", name: "Accessibility", color: "yellow" },
  { id: "l-bug", name: "Bug", color: "red" },
] as const satisfies readonly BacklogLabel[];

export type BacklogTask = {
  /** The human key shown on the row — `"TIZ-14"`, not a UUID. */
  id: string;
  title: string;
  /** Absent on a task filed as a one-liner, which is most of them. */
  description?: string;
  priority: ProjectPriority;
  /** Absent until someone estimates it. Never 0 — unestimated is not zero. */
  storyPoints?: number;
  /** Absent while the task is unclaimed. */
  assignee?: ProjectPerson;
  labels: BacklogLabel[];
  /** `null` for everything in the backlog. Planning is what sets it. */
  sprintId: string | null;
};

/**
 * The estimate scale offered by the editor. Fibonacci, because the point of
 * the ladder is that the gaps widen as the confidence drops.
 */
export const STORY_POINT_SCALE = [1, 2, 3, 5, 8, 13] as const;

/**
 * The editor's working copy. Flat, all-strings-and-ids, because that is what a
 * form holds — `assigneeId` rather than a `ProjectPerson`, so an unassigned
 * task is `""` and not a hole in the object.
 */
export type TaskDraft = {
  title: string;
  description: string;
  priority: ProjectPriority;
  /** `null` is "unestimated"; the picker's None option. */
  storyPoints: number | null;
  /** `""` is unassigned. */
  assigneeId: string;
  labelIds: string[];
};
