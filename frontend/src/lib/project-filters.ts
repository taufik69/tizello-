import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectPriority,
  type ProjectStatus,
} from "@/types/project";

/*
 * Filter, search and sort for the Projects screens, as ONE search-param model.
 *
 * WHY THE URL AND NOT COMPONENT STATE. A filtered board is a thing people send
 * to each other ("the on-hold ones, mine, oldest first"), come back to from a
 * bookmark, and reach with the back button after clicking into a project. All
 * three are free if the state is in the URL and none of them are if it lives
 * in a `useState` — and the page is already a Server Component reading
 * `searchParams`, so URL state costs no client JavaScript to READ. Only the
 * controls that write it are client leaves.
 *
 * STATUS, PRIORITY, `q` AND `mine` GO TO THE API; SORT DOES NOT. The list
 * endpoint takes the first four (`lib/projects.ts`) — which matters, because
 * filtering server-side is the difference between narrowing a result and
 * narrowing a PAGE of a result, and the endpoint caps at 100 rows. It has no
 * ordering parameter at all, so `sort` is applied to the rows after they
 * arrive (`lib/project-sort.ts`).
 *
 * EVERY VALUE IS VALIDATED AGAINST A FIXED LIST and anything unrecognised
 * falls back to the default, because a URL can carry anything — `?status=`,
 * `?status=%00`, `?status=a&status=b`. A junk query string is a typo, not a
 * 500. Same rule `parseProjectView` already follows.
 *
 * DEFAULTS ARE WRITTEN AS ABSENCES. `?sort=updated` never appears, because
 * updated-descending is what the API already returns; a param that means "the
 * default" would give the same screen two URLs and make "are any filters on?"
 * a string comparison instead of a field check.
 */

export const PROJECT_SORTS = [
  "updated",
  "created",
  "name",
  "key",
  "status",
  "priority",
  "start",
  "end",
] as const;
export type ProjectSort = (typeof PROJECT_SORTS)[number];

export const PROJECT_SORT_LABEL: Record<ProjectSort, string> = {
  updated: "Last updated",
  created: "Date created",
  name: "Name",
  key: "Key",
  status: "Status",
  priority: "Priority",
  start: "Start date",
  end: "End date",
};

export type SortDirection = "asc" | "desc";

/** Newest-first, which is the order the API already returns — so it writes no param. */
export const DEFAULT_SORT: ProjectSort = "updated";
export const DEFAULT_DIRECTION: SortDirection = "desc";

/**
 * The direction each field means when you first pick it.
 *
 * Text ascends (A→Z) and time descends (newest first), because that is what
 * each one means by "sorted" in every other tool. Picking a field and then
 * having to flip the arrow is a second click for the answer everybody wanted.
 */
export const NATURAL_DIRECTION: Record<ProjectSort, SortDirection> = {
  updated: "desc",
  created: "desc",
  name: "asc",
  key: "asc",
  status: "asc",
  priority: "desc",
  start: "asc",
  end: "asc",
};

export type ProjectFilters = {
  q?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  /** Owned OR collaborated on — never owned alone. The API's own definition. */
  mine: boolean;
  archived: boolean;
  sort: ProjectSort;
  direction: SortDirection;
};

export type RawParams = Record<string, string | string[] | undefined>;

/** A repeated param arrives as an array — take the first rather than throwing. */
const one = (raw: string | string[] | undefined): string | undefined =>
  (Array.isArray(raw) ? raw[0] : raw)?.trim() || undefined;

const pick = <T extends string>(
  options: readonly T[],
  raw: string | string[] | undefined,
): T | undefined => options.find((option) => option === one(raw));

export function parseProjectFilters(params: RawParams): ProjectFilters {
  const sort = pick(PROJECT_SORTS, params.sort) ?? DEFAULT_SORT;

  return {
    q: one(params.q),
    status: pick(PROJECT_STATUSES, params.status),
    priority: pick(PROJECT_PRIORITIES, params.priority),
    mine: one(params.mine) === "1",
    archived: one(params.archived) === "1",
    sort,
    /* An explicit `?dir=` wins; otherwise the field's natural direction, so
       `?sort=name` alone is A→Z rather than Z→A. */
    direction: pick(["asc", "desc"] as const, params.dir) ?? NATURAL_DIRECTION[sort],
  };
}

/** How many narrowing choices are active — what the Filter button's dot counts. */
export function activeFilterCount(filters: ProjectFilters): number {
  return [filters.q, filters.status, filters.priority, filters.mine || undefined].filter(
    Boolean,
  ).length;
}

/** The params for a link, defaults omitted. `view` and `archived` are the caller's to add. */
export function filterParams(filters: Partial<ProjectFilters>): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.mine) params.set("mine", "1");
  if (filters.archived) params.set("archived", "1");
  if (filters.sort && filters.sort !== DEFAULT_SORT) params.set("sort", filters.sort);
  if (
    filters.sort &&
    filters.direction &&
    filters.direction !== NATURAL_DIRECTION[filters.sort]
  ) {
    params.set("dir", filters.direction);
  }

  return params;
}
