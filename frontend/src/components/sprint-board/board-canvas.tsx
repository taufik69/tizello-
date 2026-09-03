"use client";

import { type Dispatch, type SetStateAction } from "react";
import { DndContext } from "@dnd-kit/core";
import {
  BOARD_DRAG_INSTRUCTIONS,
  boardAnnouncements,
} from "@/components/sprint-board/board-announcements";
import { SprintColumn } from "@/components/sprint-board/sprint-column";
import { TaskDragOverlay } from "@/components/sprint-board/task-drag-overlay";
import { useBoardDnd } from "@/components/sprint-board/use-board-dnd";
import { BOARD_COLUMNS, columnTasks } from "@/lib/sprint-board";
import type { SprintStatus } from "@/types/board";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * The three columns and the drag engine over them.
 *
 * The rail is the only thing on this screen that scrolls sideways: `w-list`
 * columns and `overflow-x-auto` here mean one column is readable at 360px and
 * the page itself never gains a horizontal scrollbar. `items-start` keeps a
 * short column short rather than stretching its drop zone to the tallest one.
 *
 * `columnTasks` is the only thing that decides what is in a column — a card's
 * `status` IS its column, so there is no per-column array to keep in step.
 */
export function BoardCanvas({
  tasks,
  setTasks,
  onOpen,
  onQuickAdd,
}: {
  tasks: SprintBoardTask[];
  setTasks: Dispatch<SetStateAction<SprintBoardTask[]>>;
  onOpen: (task: SprintBoardTask) => void;
  onQuickAdd: (status: SprintStatus, title: string) => void;
}) {
  const { activeId, dndContextProps } = useBoardDnd(setTasks);
  const activeTask = tasks.find((task) => task.id === activeId) ?? null;

  return (
    <DndContext
      /* A FIXED id, not dnd-kit's generated one. It ends up as the
         `aria-describedby` on every drag handle, and the library's fallback is
         a module-level counter that starts from a different number on the
         server than it does at hydration — which React reports as a mismatch
         and refuses to patch. Naming it once removes the guess. */
      id="sprint-board-drag"
      {...dndContextProps}
      accessibility={{
        announcements: boardAnnouncements(tasks),
        screenReaderInstructions: BOARD_DRAG_INSTRUCTIONS,
      }}
    >
      <div className="scrollbar-board flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-4 pb-4">
        {BOARD_COLUMNS.map((column) => (
          <SprintColumn
            key={column.id}
            column={column}
            tasks={columnTasks(tasks, column.status)}
            activeStatus={activeTask?.status ?? null}
            onOpen={onOpen}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>

      <TaskDragOverlay task={activeTask} />
    </DndContext>
  );
}
