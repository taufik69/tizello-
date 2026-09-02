import { TopBar } from "@/components/layout/top-bar";

const SKELETON_LISTS = [3, 2, 2, 3];

/** Streaming fallback: the shell paints immediately while the board resolves. */
export default function BoardLoading() {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1 flex-col bg-board">
        <div className="px-4 py-3">
          <div className="h-5 w-40 animate-pulse rounded-sm bg-on-board/20" />
        </div>

        <div className="flex flex-1 items-start gap-3 overflow-hidden px-4 pb-4">
          {SKELETON_LISTS.map((cardCount, listIndex) => (
            <div
              key={listIndex}
              className="w-list shrink-0 space-y-2 rounded-lg bg-canvas p-2"
            >
              <div className="h-4 w-24 animate-pulse rounded-sm bg-surface-sunken" />
              {Array.from({ length: cardCount }).map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-14 animate-pulse rounded-md bg-surface shadow-card"
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
