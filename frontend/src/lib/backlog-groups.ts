import { PROJECT_PRIORITIES, type ProjectPriority } from "@/types/project";
import type { BacklogTask } from "@/types/backlog";

/*
 * The backlog's ordering rules, kept out of the components so the list, the
 * group headers and the counts cannot disagree about them.
 *
 * `PRIORITY_LABEL` is NOT redefined here — `project-groups.ts` already owns the
 * display strings for the same three-member enum, and a second copy would
 * drift.
 */

export type PriorityGroup = {
  priority: ProjectPriority;
  tasks: BacklogTask[];
};

/**
 * One entry per priority in canonical order — HIGH, MEDIUM, LOW — and empty
 * groups are kept. A heading that vanishes when its last task is dragged out
 * is a heading you cannot drag back onto, and "no High priority work left" is
 * a thing worth being able to see.
 *
 * Order INSIDE a group is the order the tasks arrive in, which is the order
 * they were filed. Nothing re-sorts them; a manual rank column is what real
 * backlog ordering needs and it does not exist yet.
 */
export function groupByPriority(tasks: BacklogTask[]): PriorityGroup[] {
  return PROJECT_PRIORITIES.map((priority) => ({
    priority,
    tasks: tasks.filter((task) => task.priority === priority),
  }));
}

/** Estimated points only. Unestimated tasks contribute nothing, not zero. */
export function totalPoints(tasks: BacklogTask[]): number {
  return tasks.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0);
}

/**
 * The next key in the `TIZ-n` sequence, one past the highest already used.
 *
 * Derived rather than random: the id is shown on every row, and `TIZ-3f9a` next
 * to `TIZ-25` would read as a different kind of thing. Ids that do not parse
 * are skipped rather than crashing the reduce.
 */
export function nextTaskId(tasks: BacklogTask[], prefix = "TIZ"): string {
  const highest = tasks.reduce((max, task) => {
    const value = Number.parseInt(task.id.split("-")[1] ?? "", 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 0);

  return `${prefix}-${highest + 1}`;
}
