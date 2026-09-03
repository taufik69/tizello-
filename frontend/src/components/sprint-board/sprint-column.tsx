"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { QuickAddRow } from "@/components/backlog/quick-add-row";
import { BoardColumn } from "@/components/board/board-column";
import { SortableTaskCard } from "@/components/sprint-board/sortable-task-card";
import type { BoardColumnMeta } from "@/lib/sprint-board";
import type { SprintStatus } from "@/types/board";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * One column, wired for drops. The chrome is `BoardColumn` — the same shell the
 * backlog board renders — with dnd-kit's droppable node on its track, so the
 * empty column is a target too rather than a hole between two lists.
 *
 * `SortableContext` is what lets the cards below shift out of the way as one is
 * dragged past them, and it is per column: three vertical lists, not one grid.
 *
 * The drop indicator reads `activeStatus`, not just dnd-kit's `isOver`. `isOver`
 * is true only while the COLUMN itself is the nearest target — hover a card and
 * it goes false, which would blink the highlight off exactly when the answer to
 * "where does this land?" matters most. A card's status is already updated the
 * moment it crosses into a column, so the column holding the dragged card is
 * the column it would land in.
 *
 * The composer is `QuickAddRow`, the backlog's own title-only quick add. A card
 * filed here lands at the bottom of THIS column, which is the only thing the
 * board adds to it.
 */
export function SprintColumn({
  column,
  tasks,
  activeStatus,
  onOpen,
  onQuickAdd,
}: {
  column: BoardColumnMeta;
  /** Already filtered to this column and ranked. */
  tasks: SprintBoardTask[];
  /** The column the card being dragged currently sits in, if one is. */
  activeStatus: SprintStatus | null;
  onOpen: (task: SprintBoardTask) => void;
  onQuickAdd: (status: SprintStatus, title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { status: column.status },
  });

  return (
    <BoardColumn
      listId={column.id}
      title={column.title}
      tone={column.tone}
      count={tasks.length}
      emptyLabel="No tasks"
      isOver={isOver || activeStatus === column.status}
      containerRef={setNodeRef}
      footer={
        <QuickAddRow
          listTitle={column.title}
          onAdd={(title) => onQuickAdd(column.status, title)}
        />
      }
    >
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
      </SortableContext>
    </BoardColumn>
  );
}
