/* Three, because the sprint board is the screen this route is for and its
   columns are fixed: To do, In progress, Done. */
const SKELETON_LISTS = [3, 2, 3];

/** Streaming fallback: the shell paints immediately while the board resolves. */
export default function BoardLoading() {
  return (
    <div className="flex h-full flex-col bg-surface-sunken">
      <div className="space-y-2 px-4 pt-4 pb-3">
        <div className="h-3 w-24 animate-pulse rounded-xs bg-surface" />
        <div className="h-5 w-56 animate-pulse rounded-sm bg-surface" />
        <div className="h-3 w-40 animate-pulse rounded-xs bg-surface" />
      </div>

      <div className="flex flex-1 items-start gap-4 overflow-hidden px-4 pb-4">
        {SKELETON_LISTS.map((cardCount, listIndex) => (
          <div key={listIndex} className="w-list shrink-0 space-y-1.5">
            <div className="mb-2 h-4 w-24 animate-pulse rounded-xs bg-surface" />
            {Array.from({ length: cardCount }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="h-14 animate-pulse rounded-sm border border-border bg-surface"
              />
            ))}
          </div>
        ))}
      </div>

      <span className="sr-only" role="status">
        Loading board
      </span>
    </div>
  );
}
