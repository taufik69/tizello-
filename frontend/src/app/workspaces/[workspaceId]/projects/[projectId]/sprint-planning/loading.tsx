const SKELETON_ROWS = ["a", "b", "c", "d"];

/**
 * Mirrors the real page's rhythm: header block, the selector-and-capacity
 * strip, then two panels side by side at the same breakpoint they really
 * split at. Same heights, so the switch from skeleton to content is not a jump.
 */
export default function SprintPlanningLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-xs bg-surface-sunken" />
        <div className="h-6 w-44 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="h-9 w-48 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-9 w-40 animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
        {["backlog", "sprint"].map((side) => (
          <div key={side} className="rounded-lg border border-border p-3">
            <div className="h-4 w-24 animate-pulse rounded-sm bg-surface-sunken" />
            <div className="mt-2 h-8 w-full animate-pulse rounded-sm bg-surface-sunken" />
            <div className="mt-2 space-y-1.5">
              {SKELETON_ROWS.map((row) => (
                <div
                  key={row}
                  className="h-16 animate-pulse rounded-md bg-surface-sunken"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading sprint planning
      </span>
    </main>
  );
}
