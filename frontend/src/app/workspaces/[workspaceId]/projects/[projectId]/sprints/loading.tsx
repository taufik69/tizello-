const SKELETON_CARDS = ["a", "b", "c"];

/**
 * Mirrors the real page's rhythm: header block, the count-and-controls strip, a
 * group heading, then cards. Same heights, so the switch from skeleton to
 * content is not a jump.
 */
export default function SprintsLoading() {
  return (
    <main className="w-full px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-xs bg-surface-sunken" />
        <div className="h-6 w-28 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-7 w-40 animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-4 h-5 w-24 animate-pulse rounded-sm bg-surface-sunken" />

      <div className="mt-2 space-y-2">
        {SKELETON_CARDS.map((id) => (
          <div
            key={id}
            className="h-32 animate-pulse rounded-md bg-surface-sunken"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading sprints
      </span>
    </main>
  );
}
