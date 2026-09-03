/**
 * A project whose backlog is empty — reachable, not decoration: the getter
 * returns `[]` for an unknown project id, and deleting the last task lands
 * here too.
 *
 * The quick-add row stays below this, so the instruction has somewhere to
 * point.
 */
export function BacklogEmpty() {
  return (
    <div className="rounded-md border border-dashed border-border bg-surface-sunken px-4 py-10 text-center">
      <p className="text-sm font-medium text-text">No items in backlog yet</p>
      <p className="mt-1 text-xs text-text-subtle">
        Add your first task &mdash; everything the team might do lands here
        before it is pulled into a sprint.
      </p>
    </div>
  );
}
