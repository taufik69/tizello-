import {
  PROJECT_STATUSES,
  type ProjectRecord,
  type ProjectStatus,
} from "@/types/project";

/*
 * Display strings. Stored values are uppercase; nothing renders them raw.
 *
 * Re-exported from `types/project.ts` rather than declared again here: three
 * screens render a status and one map is what stops "On hold" becoming
 * "Paused" on one of them.
 */
export { PROJECT_STATUS_LABEL as STATUS_LABEL, PROJECT_PRIORITY_LABEL as PRIORITY_LABEL } from "@/types/project";

export type StatusGroup = {
  status: ProjectStatus;
  projects: ProjectRecord[];
};

/**
 * One entry per status in canonical order, INCLUDING the empty ones — a board
 * column that vanishes when its last card leaves is a column you cannot drop
 * onto, and a breakdown that hides 0% hides the fact that it is 0%.
 *
 * `includeEmpty: false` is for the grouped table, where a heading with no rows
 * under it is just noise.
 */
export function groupByStatus(
  projects: ProjectRecord[],
  { includeEmpty = true }: { includeEmpty?: boolean } = {},
): StatusGroup[] {
  return PROJECT_STATUSES.map((status) => ({
    status,
    projects: projects.filter((project) => project.status === status),
  })).filter((group) => includeEmpty || group.projects.length > 0);
}

/*
 * The timeline's three lanes.
 *
 * The timeline groups by PHASE rather than by status, because six lanes for
 * six statuses would put one project in most of them and the gantt would read
 * as a list. Notion's own timeline groups on a rollup for the same reason.
 * Mapping is total: every status belongs to exactly one phase, so no project
 * can fall off the chart.
 */
export const TIMELINE_PHASES = ["TODO", "IN_PROGRESS", "COMPLETE"] as const;
export type TimelinePhase = (typeof TIMELINE_PHASES)[number];

export const PHASE_LABEL: Record<TimelinePhase, string> = {
  TODO: "To-do",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

/*
 * Total by construction: every status belongs to exactly one phase, so no
 * project can fall off the chart.
 *
 * CANCELLED sits in COMPLETE rather than earning a fourth lane. It is finished
 * work in the only sense a timeline cares about — nothing further will happen
 * on those dates — and a lane holding the rare cancelled project would be
 * empty on most boards. The status chip on the bar still says CANCELLED, in
 * `danger`, so the two are not confusable at the row level.
 */
const PHASE_OF: Record<ProjectStatus, TimelinePhase> = {
  BACKLOG: "TODO",
  PLANNING: "TODO",
  ACTIVE: "IN_PROGRESS",
  ON_HOLD: "IN_PROGRESS",
  COMPLETED: "COMPLETE",
  CANCELLED: "COMPLETE",
};

export type PhaseGroup = {
  phase: TimelinePhase;
  projects: ProjectRecord[];
};

export function groupByPhase(projects: ProjectRecord[]): PhaseGroup[] {
  return TIMELINE_PHASES.map((phase) => ({
    phase,
    projects: projects.filter((project) => PHASE_OF[project.status] === phase),
  }));
}

/**
 * How many projects are finished, for the `COMPLETE 1/6` summary row.
 *
 * COMPLETED only — a cancelled project is not a delivered one, and counting it
 * as done would flatter the number the row exists to report. That is the one
 * place CANCELLED and COMPLETED part company after `PHASE_OF` groups them.
 */
export function completeCount(projects: ProjectRecord[]): number {
  return projects.filter((project) => project.status === "COMPLETED").length;
}
