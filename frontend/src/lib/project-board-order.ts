import {
  PROJECT_STATUSES,
  type ProjectRecord,
  type ProjectStatus,
} from "@/types/project";

/*
 * The board's column map — which project ids sit in which status column, in
 * which order — and how the server's version and the user's are reconciled.
 *
 * The board renders from a `Record<column, ids>`, and `place()` below is what
 * a drop writes into it — one call, on release, where the old @dnd-kit build
 * called the library's `move()` on every frame of the drag. That map is client
 * state; the projects it describes come from the server on every revalidation.
 * Keeping the two in step is this module's whole job, and it is done by
 * DERIVING rather than by syncing:
 *
 *   reconcile(base, stored)
 *
 * runs during render, so a project created in another tab appears without an
 * effect writing state — which would trip `react-hooks/set-state-in-effect`
 * and would fight the server on every refresh besides.
 *
 * ORDER WITHIN A COLUMN IS NOT SAVED, and that is a property of the schema
 * rather than a shortcut. `Project` has no rank field
 * (`backend/prisma/schema.prisma`), so the only thing a drop can persist is
 * the STATUS. The order a card is dropped at holds for the session and the
 * server's order returns on reload. Cards still slide out of each other's way
 * during the drag — that is what makes the gesture readable — and the column a
 * card lands in is the part that is real.
 */
export type ColumnMap = Record<ProjectStatus, string[]>;

/** The server's view: every project in its own status column, in the order the API returned. */
export function baseColumns(projects: ProjectRecord[]): ColumnMap {
  const columns = {} as ColumnMap;

  for (const status of PROJECT_STATUSES) {
    columns[status] = projects
      .filter((project) => project.status === status)
      .map((project) => project.id);
  }

  return columns;
}

/**
 * Whether two maps describe the same board — same ids, same columns, same order.
 *
 * Used only to let `reconcile` hand BACK the object it was given, and that
 * identity is load-bearing rather than an optimisation. `onDragOver` fires at
 * pointer-move frequency and runs
 * `setStored(current => move(reconcile(base, current), event))`. `move()`
 * already has a fast path — it returns its input BY REFERENCE when the drag
 * has not actually changed the order — but `reconcile` used to build a fresh
 * object unconditionally, so that reference was never `current`, and React
 * re-rendered all six columns on every frame of every drag. dnd-kit re-measures
 * its sortables when their props change, so each of those renders re-ran the
 * collision that produced it: the cards in the column under the cursor
 * shuffled, settled, and shuffled again, continuously, for as long as the card
 * was held. That was the jitter.
 *
 * With this, an unchanged drag frame returns the identical object all the way
 * back out to `setStored`, React bails out of the render, and the cards move
 * exactly once per real change.
 */
function sameColumns(a: ColumnMap, b: ColumnMap): boolean {
  return PROJECT_STATUSES.every((status) => {
    const left = a[status] ?? [];
    const right = b[status] ?? [];

    return left.length === right.length && left.every((id, at) => id === right[at]);
  });
}

/**
 * The server's columns with this session's moves laid over them.
 *
 * Three things have to survive at once, and the set arithmetic is what does it:
 *
 * - A card the user MOVED stays where they put it. `placed` is every id the
 *   stored map mentions, and an id in there is never re-added from `base` —
 *   which is what stops a project appearing in both its old column and its new
 *   one for the render between the drop and the revalidation.
 * - A project DELETED elsewhere disappears. `known` is what the server still
 *   returns, and the stored map is filtered down to it.
 * - A project CREATED elsewhere appears, at the TOP of its column, because the
 *   API returns projects newest first and the board should not bury a new one
 *   under a column the user happens to have reordered.
 */
export function reconcile(base: ColumnMap, stored: ColumnMap | null): ColumnMap {
  if (!stored) return base;

  const known = new Set(Object.values(base).flat());
  const placed = new Set(Object.values(stored).flat());
  const columns = {} as ColumnMap;

  for (const status of PROJECT_STATUSES) {
    const kept = (stored[status] ?? []).filter((id) => known.has(id));
    const fresh = base[status].filter((id) => !placed.has(id));
    columns[status] = [...fresh, ...kept];
  }

  /* Same board, same object — see `sameColumns`. */
  return sameColumns(columns, stored) ? stored : columns;
}

/**
 * The map with one card moved to `index` of `status` — what a drop commits.
 *
 * Removed from EVERY column before it is inserted, rather than only from the
 * one it is believed to be in. A card the map lists twice is the bug this
 * shape can actually have (a revalidation landing mid-gesture), and a filter
 * over all six columns costs nothing and cannot express it.
 *
 * The index is clamped rather than trusted: it was resolved from geometry
 * frozen at the press (`lib/board-drag.ts`), and the column may have gained or
 * lost a card since.
 */
export function place(
  columns: ColumnMap,
  projectId: string,
  status: ProjectStatus,
  index: number,
): ColumnMap {
  const next = {} as ColumnMap;

  for (const column of PROJECT_STATUSES) {
    next[column] = columns[column].filter((id) => id !== projectId);
  }

  const at = Math.max(0, Math.min(index, next[status].length));
  next[status] = [...next[status].slice(0, at), projectId, ...next[status].slice(at)];

  return next;
}

/** Which column a project is in, or `null` for one the map has never heard of. */
export function statusOf(columns: ColumnMap, projectId: string): ProjectStatus | null {
  return (
    PROJECT_STATUSES.find((status) => columns[status].includes(projectId)) ?? null
  );
}

/** The projects of one column, in the map's order — the shape a column renders from. */
export function columnProjects(
  projects: ProjectRecord[],
  ids: string[],
): ProjectRecord[] {
  const byId = new Map(projects.map((project) => [project.id, project]));

  return ids
    .map((id) => byId.get(id))
    .filter((project): project is ProjectRecord => project !== undefined);
}
