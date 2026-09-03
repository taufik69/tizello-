import { SPRINT_STATES, type SprintRecord, type SprintState } from "@/types/sprint";

/*
 * The sprints list's ordering rules, kept out of the components so the groups,
 * the headers and the counts cannot disagree about them.
 *
 * `project-groups.ts` owns the same job for projects; this is deliberately a
 * second module rather than a generic one, because the two disagree about
 * empty groups and about sort direction, and a shared helper taking four
 * options would be harder to read than either.
 */

/** Display strings. Stored values are uppercase; nothing renders them raw. */
export const SPRINT_STATE_LABEL: Record<SprintState, string> = {
  ACTIVE: "Active",
  PLANNING: "Planning",
  COMPLETED: "Completed",
};

/** One line under each group heading, saying what being in it means. */
export const SPRINT_STATE_BLURB: Record<SprintState, string> = {
  ACTIVE: "Running now. Only one sprint can be active at a time.",
  PLANNING: "Scheduled, not started. Tasks are pulled in during planning.",
  COMPLETED: "Closed. Unfinished work went back to the backlog.",
};

export type SprintGroup = {
  state: SprintState;
  sprints: SprintRecord[];
};

/**
 * One entry per state in canonical order, EMPTY GROUPS DROPPED — the opposite
 * of `groupByStatus`, and for a reason: a board column with no cards is still
 * a place to drop one, but an "Active" heading over nothing is just a second
 * way of saying what the list already shows. When every group is empty the
 * caller renders the empty state instead.
 *
 * Inside a group: COMPLETED runs newest first, because the sprint that just
 * closed is the one anybody is looking for. The other two run oldest first,
 * which is the order they will happen in.
 */
export function groupByState(sprints: SprintRecord[]): SprintGroup[] {
  return SPRINT_STATES.map((state) => ({
    state,
    sprints: sprints
      .filter((sprint) => sprint.state === state)
      .sort((a, b) =>
        state === "COMPLETED"
          ? b.startDate.localeCompare(a.startDate)
          : a.startDate.localeCompare(b.startDate),
      ),
  })).filter((group) => group.sprints.length > 0);
}

/** The one running sprint, if there is one. The whole single-active rule reads through this. */
export function activeSprint(sprints: SprintRecord[]): SprintRecord | undefined {
  return sprints.find((sprint) => sprint.state === "ACTIVE");
}

/**
 * Done as a percentage, for the bar's width. A sprint nobody has planned into
 * is 0% rather than NaN — `0 / 0` is the empty PLANNING sprint, which is a real
 * row, not a broken one.
 */
export function donePercent(sprint: SprintRecord): number {
  if (sprint.itemCount === 0) return 0;
  return Math.round((sprint.doneCount / sprint.itemCount) * 100);
}

/**
 * The next key in the `SPR-n` sequence, one past the highest already used.
 *
 * Derived rather than random, exactly as `nextTaskId` is: the id is shown on
 * every card, and `SPR-9c1e` next to `SPR-15` would read as a different kind of
 * thing. Ids that do not parse are skipped rather than crashing the reduce.
 */
export function nextSprintId(sprints: SprintRecord[], prefix = "SPR"): string {
  const highest = sprints.reduce((max, sprint) => {
    const value = Number.parseInt(sprint.id.split("-")[1] ?? "", 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 0);

  return `${prefix}-${highest + 1}`;
}

/** `"Sprint 16"` — the name the composer pre-fills, one past the highest number seen. */
export function nextSprintName(sprints: SprintRecord[]): string {
  const highest = sprints.reduce((max, sprint) => {
    const value = Number.parseInt(/\d+/.exec(sprint.name)?.[0] ?? "", 10);
    return Number.isNaN(value) ? max : Math.max(max, value);
  }, 0);

  return `Sprint ${highest + 1}`;
}
