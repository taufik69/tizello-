const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f"];

/**
 * Mirrors the real page's rhythm: header block, the view strip with the
 * toolbar to its right, then rows. Same heights, so the switch from skeleton
 * to content is not a jump.
 */
export default function ProjectsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-xs bg-surface-sunken" />
        <div className="h-6 w-32 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-1.5">
        <div className="h-6 w-64 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-7 w-40 animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-4 space-y-1.5">
        {SKELETON_ROWS.map((id) => (
          <div
            key={id}
            className="h-9 animate-pulse rounded-sm bg-surface-sunken"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading projects
      </span>
    </main>
  );
}
