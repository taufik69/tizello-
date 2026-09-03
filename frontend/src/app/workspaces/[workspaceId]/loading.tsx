const SKELETON_CARDS = ["a", "b", "c"];

export default function WorkspaceLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="size-8 animate-pulse rounded-full bg-surface-sunken" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-52 animate-pulse rounded-sm bg-surface-sunken" />
          <div className="h-4 w-32 animate-pulse rounded-sm bg-surface-sunken" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SKELETON_CARDS.map((id) => (
          <div
            key={id}
            className="h-36 animate-pulse rounded-md border border-border bg-surface"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading workspace
      </span>
    </main>
  );
}
