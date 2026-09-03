/**
 * Reachable state, not decoration: a workspace whose roster has not loaded a
 * single row still has to say something. Flat and bordered, like the rows it
 * stands in for.
 */
export function MembersEmpty() {
  return (
    <div className="mt-4 rounded-md border border-dashed border-border bg-surface-sunken px-4 py-10 text-center">
      <p className="text-sm font-medium text-text">No members yet</p>
      <p className="mt-1 text-xs text-text-subtle">
        Invite someone by email and they will appear here.
      </p>
    </div>
  );
}
