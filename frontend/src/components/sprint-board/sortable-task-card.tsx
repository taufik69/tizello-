"use client";

import { useSortable } from "@dnd-kit/sortable";
import { TASK_CARD_SHELL, TaskCard } from "@/components/sprint-board/task-card";
import { GripIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * A card that can be dragged, and a card that can be opened. Two jobs, two
 * controls, because one control cannot do both from the keyboard: dnd-kit picks
 * a card up on Enter or Space and calls `preventDefault`, so a card that was
 * itself the button would have no key left to open its detail panel with.
 *
 * So the body is a button that opens the panel, and the handle is a button that
 * starts a drag — Enter or Space to pick up, arrows to move (including into
 * another column), Space to drop, Escape to cancel. The handle appears on hover
 * and whenever anything inside the card has focus, so it is reachable without a
 * pointer.
 *
 * The pointer can still drag from anywhere on the card: the same listeners sit
 * on the shell. dnd-kit stamps the native event when a sensor claims it, so the
 * two handlers cannot start two drags.
 */
const HANDLE =
  "absolute top-1 right-1 grid size-5 place-items-center rounded-xs text-text-subtle opacity-0 transition-opacity duration-100 ease-standard group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100";

export function SortableTaskCard({
  task,
  onOpen,
}: {
  task: SprintBoardTask;
  onOpen: (task: SprintBoardTask) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { status: task.status } });

  const startDrag = listeners?.onPointerDown as
    | React.PointerEventHandler
    | undefined;

  return (
    <li
      ref={setNodeRef}
      /* The one place `style` is right: both values are computed per frame by
         the drag engine, and neither can be a utility. */
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition: transition ?? undefined,
      }}
      className={cn("group relative", isDragging && "opacity-40")}
    >
      <div className={cn(TASK_CARD_SHELL, "hover:bg-surface-hover")}>
        <button
          type="button"
          onPointerDown={startDrag}
          onClick={() => onOpen(task)}
          className="block w-full cursor-pointer rounded-md text-left"
        >
          <TaskCard task={task} />
          <span className="sr-only">Open details</span>
        </button>

        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          /* The shell's own handler must not run a second time for the same
             press, so the handle keeps its pointerdown to itself. */
          onPointerDown={(event) => {
            event.stopPropagation();
            startDrag?.(event);
          }}
          aria-label={`Move ${task.id}: ${task.title}`}
          className={HANDLE}
        >
          <GripIcon className="size-3.5" />
        </button>
      </div>
    </li>
  );
}
