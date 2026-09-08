import {
  PROJECT_STATUSES,
  type ProjectRecord,
  type ProjectStatus,
} from "@/types/project";

/*
 * The board's column map — which project ids sit in which status column, in
 * which order — and how the server's version and the user's are reconciled.
 *
 * `@dnd-kit/react`'s sortable is CONTROLLED by a `Record<column, ids>`, which
 * it mutates through the `move()` helper as a card is dragged. That map is
 * client state; the projects it describes come from the server on every
 * revalidation. Keeping the two in step is this module's whole job, and it is
 * done by DERIVING rather than by syncing:
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

  return columns;
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
