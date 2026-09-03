import type { Announcements, ScreenReaderInstructions } from "@dnd-kit/core";
import { BOARD_COLUMNS } from "@/lib/sprint-board";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * What a screen reader says while a card is being dragged.
 *
 * dnd-kit ships defaults, and they are written for a generic sortable list:
 * "Draggable item 3 was moved over droppable area column-done." On a board the
 * two things worth hearing are the card's key and the column's name, so both
 * announcements are rewritten in the words that are actually on screen.
 *
 * The instructions are announced once, when the handle takes focus, which is
 * the moment someone needs to be told that arrow keys will move the card.
 */
export const BOARD_DRAG_INSTRUCTIONS: ScreenReaderInstructions = {
  draggable:
    "Press Space or Enter to pick this card up. Use the arrow keys to move it within its column, or left and right to move it to another column, which changes its status. Press Space or Enter again to drop it, or Escape to cancel.",
};

/** A drop target's column, whether the target was a column or a card in one. */
function columnTitle(tasks: SprintBoardTask[], overId: string): string {
  const column = BOARD_COLUMNS.find((entry) => entry.id === overId);
  if (column) return column.title;

  const status = tasks.find((task) => task.id === overId)?.status;
  return BOARD_COLUMNS.find((entry) => entry.status === status)?.title ?? "the board";
}

export function boardAnnouncements(tasks: SprintBoardTask[]): Announcements {
  return {
    onDragStart: ({ active }) =>
      `Picked up ${active.id}. It is in ${columnTitle(tasks, String(active.id))}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${active.id} is over ${columnTitle(tasks, String(over.id))}.`
        : `${active.id} is not over a column.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${active.id} dropped into ${columnTitle(tasks, String(over.id))}.`
        : `${active.id} was dropped outside the board and stayed where it was.`,
    onDragCancel: ({ active }) =>
      `Dragging ${active.id} cancelled. It stayed where it was.`,
  };
}
