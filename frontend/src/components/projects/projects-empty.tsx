/**
 * A workspace with no projects at all. Reachable, not decoration: the getters
 * return `[]` for an unknown workspace id, and every one of the five views
 * routes here rather than rendering an empty table, an empty gantt or a donut
 * of nothing.
 */
export function ProjectsEmpty({
  message = "Projects created in this workspace will appear here.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-sunken px-4 py-10 text-center">
      <p className="text-sm font-medium text-text">No projects yet</p>
      <p className="mt-1 text-xs text-text-subtle">{message}</p>
    </div>
  );
}
