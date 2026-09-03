/**
 * A project with no sprints — reachable, not decoration: the getter returns
 * `[]` for an unknown project id, and deleting the last sprint lands here too.
 *
 * "New sprint" stays in the toolbar above rather than being repeated inside the
 * panel: one control, one place, and the instruction points at it.
 */
export function SprintsEmpty() {
  return (
    <div className="mt-4 rounded-md border border-dashed border-border bg-surface-sunken px-4 py-10 text-center">
      <p className="text-sm font-medium text-text">
        No sprints yet &mdash; create your first sprint
      </p>
      <p className="mx-auto mt-1 max-w-prose text-xs text-text-subtle">
        A sprint is a name and a date range. Once it exists you can start it,
        and sprint planning is what pulls work in from the backlog.
      </p>
    </div>
  );
}
