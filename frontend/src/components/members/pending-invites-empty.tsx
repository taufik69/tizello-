/**
 * Genuinely reachable, not decoration: cancelling the last outstanding
 * invitation lands here. Flat, dashed and sunken, like `MembersEmpty` — the
 * two states sit behind the same tab strip and must not look like two designs.
 */
export function PendingInvitesEmpty() {
  return (
    <div className="mt-4 rounded-md border border-dashed border-border bg-surface-sunken px-4 py-10 text-center">
      <p className="text-sm font-medium text-text">No invitations outstanding</p>
      <p className="mt-1 text-xs text-text-subtle">
        Everyone invited so far has accepted. Invite someone else and they will
        wait here until they do.
      </p>
    </div>
  );
}
