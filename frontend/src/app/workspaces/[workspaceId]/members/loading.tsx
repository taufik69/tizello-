const SKELETON_ROWS = ["a", "b", "c", "d", "e"];

export default function MembersLoading() {
  return (
    <main className="w-full px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded-xs bg-surface-sunken" />
        <div className="h-6 w-40 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      {/* Left block is the tab strip, so the skeleton keeps its height rather
          than jumping 24px the moment the real toolbar arrives. */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-sunken" />
        <div className="h-9 w-32 animate-pulse rounded-sm bg-surface-sunken" />
      </div>

      <div className="mt-4 space-y-2">
        {SKELETON_ROWS.map((id) => (
          <div
            key={id}
            className="h-[4.5rem] animate-pulse rounded-md border border-border bg-surface sm:h-16"
          />
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading members
      </span>
    </main>
  );
}
