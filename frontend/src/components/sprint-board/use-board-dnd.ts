"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { moveTaskTo, statusOfDropTarget } from "@/lib/sprint-board";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * The drag engine's wiring, kept out of the board so the board is composition
 * and this is behaviour.
 *
 * TWO SENSORS, ON PURPOSE. The pointer sensor waits 6px before it claims a
 * press, so a click on a card still opens its detail panel; the keyboard sensor
 * is what makes the board usable without a pointer at all, and
 * `sortableKeyboardCoordinates` is what turns an arrow key into a drop target —
 * including the columns' own droppables, which is how a card reaches an EMPTY
 * column from the keyboard.
 *
 * WHERE THE STATE CHANGES. Reordering inside a column needs no state at all
 * while the drag is in flight: the sorting strategy slides the neighbours out
 * of the way and the drop is what commits. Crossing INTO another column does,
 * because the card has to appear there to be sorted among that column's cards —
 * so `onDragOver` re-columns it and `onDragEnd` settles the final rank.
 *
 * Every update goes through the updater form. Drag events arrive faster than
 * React re-renders, and a stale `tasks` closure would drop a card back where it
 * was two events ago.
 *
 * NOTHING PERSISTS. `moveTaskTo` returns a new list; there is no request.
 */
export function useBoardDnd(
  setTasks: Dispatch<SetStateAction<SprintBoardTask[]>>,
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function move(taskId: string, overId: string, crossColumnOnly: boolean) {
    setTasks((current) => {
      if (crossColumnOnly) {
        const from = current.find((task) => task.id === taskId)?.status;
        const to = statusOfDropTarget(current, overId);
        if (!to || from === to) return current;
      }
      return moveTaskTo(current, taskId, overId);
    });
  }

  return {
    activeId,
    dndContextProps: {
      sensors,
      collisionDetection: closestCorners,
      onDragStart: (event: DragStartEvent) => setActiveId(String(event.active.id)),
      onDragOver: (event: DragOverEvent) => {
        if (event.over) move(String(event.active.id), String(event.over.id), true);
      },
      onDragEnd: (event: DragEndEvent) => {
        if (event.over) move(String(event.active.id), String(event.over.id), false);
        setActiveId(null);
      },
      onDragCancel: () => setActiveId(null),
    },
  };
}
