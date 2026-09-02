import { TopBar } from "@/components/layout/top-bar";

const SKELETON_LISTS = [3, 2, 2, 3];

/** Streaming fallback: the shell paints immediately while the board resolves. */
export default function BoardLoading() {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1 flex-col bg-canvas">
        <div className="px-4 py-3">
          <div className="h-5 w-40 animate-pulse rounded-sm bg-surface-sunken" />
        </div>

        <div className="flex flex-1 items-start gap-4 overflow-hidden px-4 pb-4">
          {SKELETON_LISTS.map((cardCount, listIndex) => (
            <div
              key={listIndex}
              className="w-list shrink-0 space-y-1.5"
            >
              <div className="mb-2 h-4 w-24 animate-pulse rounded-xs bg-surface-sunken" />
              {Array.from({ length: cardCount }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-14 animate-pulse rounded-sm border border-border bg-surface"
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only" role="status">
        Loading board
      </span>
    </div>
  );
}
