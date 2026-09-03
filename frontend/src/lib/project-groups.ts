import {
  PROJECT_STATUSES,
  type ProjectPriority,
  type ProjectRecord,
  type ProjectStatus,
} from "@/types/project";

/** Display strings. Stored values are uppercase; nothing renders them raw. */
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To-do",
  PLANNING: "Planning",
  IN_PROGRESS: "In Progress",
  PAUSED: "Paused",
  COMPLETE: "Complete",
};

export const PRIORITY_LABEL: Record<ProjectPriority, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

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

const PHASE_OF: Record<ProjectStatus, TimelinePhase> = {
  BACKLOG: "TODO",
  TODO: "TODO",
  PLANNING: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  PAUSED: "IN_PROGRESS",
  COMPLETE: "COMPLETE",
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

/** How many projects are finished, for the `COMPLETE 1/6` summary row. */
export function completeCount(projects: ProjectRecord[]): number {
  return projects.filter((project) => project.status === "COMPLETE").length;
}
