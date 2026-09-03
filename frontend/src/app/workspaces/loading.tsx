const SKELETON_CARDS = ["a", "b", "c", "d", "e"];

/** Streaming fallback: the shell paints while the workspace list resolves. */
export default function WorkspacesLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 space-y-2">
        <div className="h-6 w-40 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-4 w-56 animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SKELETON_CARDS.map((id) => (
          <div
            key={id}
            className="h-32 animate-pulse rounded-md border border-border bg-surface"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading workspaces
      </span>
    </main>
  );
}
