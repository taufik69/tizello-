import { groupByStatus, STATUS_LABEL } from "@/lib/project-groups";
import type { ProjectRecord, ProjectStatus } from "@/types/project";

/*
 * The numbers behind the donut. Pure arithmetic — the SVG itself is markup, and
 * there is no chart library.
 */

export type StatusSlice = {
  status: ProjectStatus;
  count: number;
  /** Whole percent, rounded on its own — see the note below. */
  percent: number;
  /** Where this arc starts, 0–100, walking the ring clockwise from 12 o'clock. */
  startPercent: number;
};

/*
 * Percentages are rounded independently, and that is a deliberate choice with
 * a visible trade-off.
 *
 * Six projects split 1/0/1/2/1/1 give 17 + 0 + 17 + 33 + 17 + 17 = 101. The
 * alternative — apportioning by largest remainder so the column totals exactly
 * 100 — makes the last tied share absorb the shortfall, so Backlog (1 project)
 * reads 17% while Complete (also 1 project) reads 16%. Two identical counts
 * showing two different percentages is the error a reader actually notices; a
 * column that adds to 101 is not.
 *
 * The counts beside them are exact, and the ARCS are drawn from the unrounded
 * fractions, so the ring is never a rounded approximation of itself.
 */

export function statusBreakdown(projects: ProjectRecord[]): StatusSlice[] {
  const groups = groupByStatus(projects);
  const counts = groups.map((group) => group.projects.length);
  const total = projects.length;
  const percents = counts.map((count) =>
    total === 0 ? 0 : Math.round((count / total) * 100),
  );

  let cursor = 0;
  return groups.map((group, index) => {
    const startPercent = cursor;
    cursor += total === 0 ? 0 : (counts[index] / total) * 100;
    return {
      status: group.status,
      count: counts[index],
      percent: percents[index],
      startPercent,
    };
  });
}

/**
 * The chart's accessible name. The legend below repeats every number as real
 * text, so the SVG is never the sole carrier of the data — this is the summary
 * a screen-reader user gets before deciding whether to read the legend at all.
 */
export function breakdownLabel(
  slices: StatusSlice[],
  total: number,
): string {
  if (total === 0) return "Status breakdown: no projects yet.";
  const parts = slices
    .filter((slice) => slice.count > 0)
    .map(
      (slice) =>
        `${STATUS_LABEL[slice.status]} ${slice.count} (${slice.percent}%)`,
    );
  return `Status breakdown of ${total} projects: ${parts.join(", ")}.`;
}
