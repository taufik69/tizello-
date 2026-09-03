import { PROJECT_PRIORITIES, type ProjectPriority } from "@/types/project";
import type { BacklogTask } from "@/types/backlog";
import type { SprintRecord } from "@/types/sprint";

/*
 * Sprint planning as pure functions: which container a task is in, moving it
 * between them, and the filtering the backlog side offers.
 *
 * WHY THIS IS NOT `lib/sprint.ts`
 * -------------------------------
 * `lib/sprint.ts` owns the same operation against the BOARD fixtures and is
 * already async — `planIntoSprint(sprintId, cardIds): Promise<number>`, wrapped
 * by `planIntoSprintAction`. These take the list as their first argument and
 * return a new one, exactly as `sprint-edit.ts` does, because the planning
 * screen holds its list in `useState` and has no server to ask.
 *
 * The argument order is deliberate: `(tasks, sprintId, taskIds)` is the same
 * `(sprintId, cardIds)` payload with the collection threaded in front, so
 * wiring the real action later is a body swap rather than a rewrite of every
 * call site.
 *
 * NOTHING HERE PERSISTS.
 */

/** The sprints you can plan into. ACTIVE is being worked; COMPLETED is history. */
export function planningSprints(sprints: SprintRecord[]): SprintRecord[] {
  return sprints
    .filter((sprint) => sprint.state === "PLANNING")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Everything not committed to a sprint — the left-hand panel. */
export function backlogTasks(tasks: BacklogTask[]): BacklogTask[] {
  return tasks.filter((task) => task.sprintId === null);
}

/** Everything pulled into one sprint — the right-hand panel. */
export function sprintTasks(
  tasks: BacklogTask[],
  sprintId: string,
): BacklogTask[] {
  return tasks.filter((task) => task.sprintId === sprintId);
}

/**
 * Backlog → sprint. A MOVE, not a copy: the task keeps its id, labels and
 * assignee and only changes container, which is what
 * `.claude/rules/workflow.md` means by "a card carries its origin".
 *
 * Tasks already in another sprint are left alone — planning pulls from the
 * backlog, and stealing a task out of a running sprint is not this screen's
 * job.
 */
export function planIntoSprint(
  tasks: BacklogTask[],
  sprintId: string,
  taskIds: string[],
): BacklogTask[] {
  return tasks.map((task) =>
    task.sprintId === null && taskIds.includes(task.id)
      ? { ...task, sprintId }
      : task,
  );
}

/** Sprint → backlog. The undo of the move above, and the same one sprint close makes. */
export function returnToBacklog(
  tasks: BacklogTask[],
  taskIds: string[],
): BacklogTask[] {
  return tasks.map((task) =>
    taskIds.includes(task.id) ? { ...task, sprintId: null } : task,
  );
}

/** `"ALL"` is not a priority, so it cannot be one of `PROJECT_PRIORITIES`. */
export type PriorityFilter = ProjectPriority | "ALL";

/** How the backlog side is ordered. `FILED` is the order tasks arrive in. */
export const PLANNING_SORTS = ["PRIORITY", "POINTS", "FILED"] as const;
export type PlanningSort = (typeof PLANNING_SORTS)[number];

export type PlanningFilters = {
  /** Matched against the id and the title, case-insensitively. */
  query: string;
  priority: PriorityFilter;
  sort: PlanningSort;
};

export const NO_FILTERS: PlanningFilters = {
  query: "",
  priority: "ALL",
  sort: "PRIORITY",
};

function rank(priority: ProjectPriority): number {
  return PROJECT_PRIORITIES.indexOf(priority);
}

/**
 * Search, filter and sort in one pass, so the count above the list and the list
 * itself cannot disagree about what is showing.
 *
 * Unestimated tasks sort LAST under `POINTS` rather than first: no estimate is
 * not an estimate of zero, and burying them at the bottom of a "biggest first"
 * list is the honest place for them.
 */
export function filterTasks(
  tasks: BacklogTask[],
  { query, priority, sort }: PlanningFilters,
): BacklogTask[] {
  const needle = query.trim().toLowerCase();

  const matched = tasks.filter((task) => {
    if (priority !== "ALL" && task.priority !== priority) return false;
    if (!needle) return true;
    return (
      task.title.toLowerCase().includes(needle) ||
      task.id.toLowerCase().includes(needle)
    );
  });

  if (sort === "FILED") return matched;

  return matched.sort((a, b) =>
    sort === "PRIORITY"
      ? rank(a.priority) - rank(b.priority)
      : (b.storyPoints ?? -1) - (a.storyPoints ?? -1),
  );
}

/**
 * How full the sprint is, as a percentage of its target, CLAMPED at 100 for the
 * bar's width — a bar that runs past its rail says nothing the number beside it
 * does not already say. `isOverCapacity` is what the over case reads.
 */
export function capacityPercent(points: number, capacity?: number): number {
  if (!capacity) return 0;
  return Math.min(100, Math.round((points / capacity) * 100));
}

export function isOverCapacity(points: number, capacity?: number): boolean {
  return capacity !== undefined && points > capacity;
}
