"use client";

import { DragOverlay, defaultDropAnimationSideEffects } from "@dnd-kit/core";
import { TASK_CARD_SHELL, TaskCard } from "@/components/sprint-board/task-card";
import { cn } from "@/lib/cn";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * The card under the pointer. It is rendered OUTSIDE the columns, in dnd-kit's
 * own layer, so it is never clipped by a column's scroll and never re-parented
 * mid-drag; the card it came from stays where it was, dimmed, until the drop
 * lands.
 *
 * This is the one card that is not flat. DESIGN-SYSTEM.md reserves elevation
 * for things that genuinely overlay something else, and a card being dragged
 * across two other columns is exactly that — so `shadow-raised`, plus the small
 * tilt that says it has been picked up rather than merely selected.
 *
 * `cursor-grabbing` sits here rather than on the card: the pointer is over this
 * element for the whole drag. No width is set either — dnd-kit measures the
 * card that was picked up and sizes this layer to match it.
 */
const DROP_ANIMATION = {
  duration: 180,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

export function TaskDragOverlay({ task }: { task: SprintBoardTask | null }) {
  return (
    <DragOverlay dropAnimation={DROP_ANIMATION}>
      {task ? (
        /* Two elements, and the outer one is deliberately plain. dnd-kit
           measures the overlay's first child to work out what the pointer is
           colliding with, and a rotated element reports a WIDER bounding box —
           enough that a card would count as overlapping the column beside it
           and an arrow key would pick the wrong target. The tilt therefore sits
           one level in, where it is decoration and nothing measures it. */
        <div>
          <div
            className={cn(
              TASK_CARD_SHELL,
              "rotate-2 cursor-grabbing shadow-raised",
            )}
          >
            <TaskCard task={task} />
          </div>
        </div>
      ) : null}
    </DragOverlay>
  );
}
