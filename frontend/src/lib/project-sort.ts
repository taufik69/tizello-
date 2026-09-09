import {
  NATURAL_DIRECTION,
  type ProjectSort,
  type SortDirection,
} from "@/lib/project-filters";
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectRecord,
} from "@/types/project";

/*
 * Ordering the project list. Client-side, and that is a constraint rather than
 * a choice: `GET /workspaces/:id/projects` has no ordering parameter, so the
 * rows arrive updated-descending and any other order is this module's job.
 *
 * IT IS SOUND HERE BECAUSE THE PAGE IS NOT PAGINATED. The endpoint caps at 100
 * rows and the screen asks for all of them, so this sorts the whole set rather
 * than one page of it — which is the difference between a sort and a lie. If a
 * workspace ever exceeds that cap, ordering has to move to the server; sorting
 * page 1 of 3 would silently show the wrong rows.
 *
 * STATUS AND PRIORITY SORT BY THEIR OWN ORDER, not alphabetically. "Active"
 * before "Backlog" before "Cancelled" is alphabetical nonsense — the meaning is
 * the pipeline, and `PROJECT_STATUSES` is already written in it. Same for
 * priority, where the declared order runs URGENT→LOW, so ascending is
 * least-urgent-first and the natural direction for the field is `desc`.
 *
 * EMPTY DATES SORT LAST IN BOTH DIRECTIONS, which is the one rule that breaks
 * the comparator's symmetry on purpose. A project with no end date is not
 * "earlier than everything" — it is unscheduled, and burying the scheduled
 * ones under it in one direction would make the sort useless in that direction.
 */
const rank = <T extends string>(order: readonly T[], value: T): number =>
  order.indexOf(value);

/** `null` for a value that has no place on the axis being sorted — see the note on dates. */
type Key = string | number | null;

function keyOf(project: ProjectRecord, sort: ProjectSort): Key {
  switch (sort) {
    case "name":
      return project.name.toLowerCase();
    case "key":
      return project.key.toLowerCase();
    case "status":
      return rank(PROJECT_STATUSES, project.status);
    case "priority":
      return rank(PROJECT_PRIORITIES, project.priority);
    case "start":
      return project.startDate || null;
    case "end":
      return project.endDate || null;
    case "created":
      return project.createdAt;
    case "updated":
      return project.updatedAt;
  }
}

function compare(a: Exclude<Key, null>, b: Exclude<Key, null>): number {
  if (typeof a === "number" && typeof b === "number") return a - b;

  return String(a).localeCompare(String(b));
}

/**
 * A new array, sorted. Never sorts in place — `projects` is the array a Server
 * Component rendered from, and mutating it would reorder the rows every OTHER
 * view on the page derives from the same fetch.
 */
export function sortProjects(
  projects: ProjectRecord[],
  sort: ProjectSort,
  direction: SortDirection = NATURAL_DIRECTION[sort],
): ProjectRecord[] {
  const flip = direction === "desc" ? -1 : 1;

  return [...projects].sort((left, right) => {
    const a = keyOf(left, sort);
    const b = keyOf(right, sort);

    /* A stable tiebreak on name, so two projects with the same status never
       swap places between renders — an unstable order looks like a bug the
       moment anything re-fetches. */
    const tie = () => left.name.localeCompare(right.name);

    /* Unscheduled last, and NOT multiplied by `flip` — that is the asymmetry
       the docblock promises. Flipping it would bury every dated project under
       the undated ones in one of the two directions. */
    if (a === null || b === null) {
      if (a === b) return tie();
      return a === null ? 1 : -1;
    }

    const result = compare(a, b);
    return result !== 0 ? result * flip : tie();
  });
}
