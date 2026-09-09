"use client";

import { ProjectBoardCard } from "@/components/projects/project-board-card";
import { cn } from "@/lib/cn";
import type { ProjectRecord } from "@/types/project";

/*
 * A board card that can be picked up, and a board card that opens its project.
 *
 * NO LIBRARY HERE ANY MORE. `lib/board-drag.ts` says why the board is
 * hand-rolled; what it means for this file is that the card has no `useSortable`
 * and no ref to hand out. It is a plain `<li>` that reports a press upward and
 * renders whatever `translateY` the board tells it to.
 *
 * `data-card` is how the board measures this element. Its rect is taken at the
 * press and never again, so `pb-2` — the gap to the next card — deliberately
 * sits INSIDE the box: it makes the measured cards tile continuously, with no
 * strip between them for a drop to resolve differently in.
 *
 * TWO CARDS, TWO TRANSFORM OWNERS. The card being CARRIED has its transform
 * written straight onto the node by `use-project-board-dnd.ts`, at frame rate,
 * so nothing is passed here for it — and `offset` is `undefined` for it, which
 * means React never touches `style.transform` and cannot fight those writes.
 * Every OTHER card gets its offset through props and slides there over 200ms.
 *
 * `transition-transform` is only on the cards that are MOVING ASIDE, and only
 * while a drag is live. On the carried card it would make the lift lag the
 * cursor; on a card at rest it would animate the snap back to zero after the
 * drop has already reordered the list — two ways of looking sloppy, from the
 * same property.
 */
export function SortableProjectCard({
  project,
  offset,
  lifted,
  canMove,
  onPointerDown,
}: {
  project: ProjectRecord;
  /** `translateY` in pixels, or `undefined` for the carried card and for a board at rest. */
  offset?: number;
  /** This is the card being carried — the board owns its transform. */
  lifted?: boolean;
  canMove: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLElement>, id: string) => void;
}) {
  return (
    <li
      data-card={project.id}
      onPointerDown={canMove ? (event) => onPointerDown(event, project.id) : undefined}
      style={offset === undefined ? undefined : { transform: `translate3d(0, ${offset}px, 0)` }}
      className={cn(
        "group relative pb-2",
        canMove && "cursor-grab select-none",
        lifted && "z-30 cursor-grabbing [&_article]:shadow-modal",
        /* TRANSITION ONLY WHILE A DRAG IS LIVE — `offset` is `undefined` at
           rest, which is the same signal. On the drop, the list reorders AND
           every offset disappears in one commit; if the transition were still
           attached, each card would animate from its old offset back to zero
           on top of a DOM that had already moved it, which is the same card
           travelling twice. Instant is correct there: the reorder IS the
           result. */
        !lifted && offset !== undefined && "transition-transform duration-200 ease-standard",
      )}
    >
      <ProjectBoardCard project={project} />
    </li>
  );
}
