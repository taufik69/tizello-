import type { ListTone, SprintStatus } from "@/types/board";
import type { BoardTotals, SprintBoardTask } from "@/types/sprint-board";

/*
 * The sprint board's rules, as pure functions: which column a task is in, where
 * it lands when it is dropped, and the roll-ups the header quotes.
 *
 * Framework-free on purpose — no React, no dnd-kit. The drag handlers pass an
 * id in and get a new list back, so the ordering logic is testable without a
 * pointer, and the same call is what a real `PATCH /tasks/:id` would send.
 *
 * NOTHING HERE PERSISTS. The board holds its list in `useState`.
 */

/**
 * The three fixed columns, in order. Adding a fourth is a product decision, not
 * a styling one — see `.claude/rules/workflow.md`.
 *
 * The tones match `boards.ts`'s `SPRINT_LIST_META`, so the pills on this board
 * and on the backlog board are the same three colours.
 */
export const BOARD_COLUMNS = [
  { status: "todo", id: "column-todo", title: "To do", tone: "neutral" },
  {
    status: "in-progress",
    id: "column-in-progress",
    title: "In progress",
    tone: "info",
  },
  { status: "done", id: "column-done", title: "Done", tone: "success" },
] as const satisfies readonly {
  status: SprintStatus;
  id: string;
  title: string;
  tone: ListTone;
}[];

export type BoardColumnMeta = (typeof BOARD_COLUMNS)[number];

/** The gap left between neighbours, and the step past either end. */
const STEP = 1024;

/** One column's tasks, ranked. Ascending `position` is the column's order. */
export function columnTasks(
  tasks: SprintBoardTask[],
  status: SprintStatus,
): SprintBoardTask[] {
  return tasks
    .filter((task) => task.status === status)
    .sort((a, b) => a.position - b.position);
}

/**
 * The rank between two neighbours. Halving the gap rather than renumbering is
 * the whole point of a float: a drop writes ONE row.
 *
 * Either end may be absent — dropping into an empty column, at the top, or at
 * the bottom — and each of those is a step rather than an average.
 */
export function positionBetween(before?: number, after?: number): number {
  if (before !== undefined && after !== undefined) return (before + after) / 2;
  if (after !== undefined) return after - STEP;
  if (before !== undefined) return before + STEP;
  return STEP;
}

/** The column a drop target belongs to — a column's own id, or a task's. */
export function statusOfDropTarget(
  tasks: SprintBoardTask[],
  overId: string,
): SprintStatus | undefined {
  const column = BOARD_COLUMNS.find((entry) => entry.id === overId);
  if (column) return column.status;
  return tasks.find((task) => task.id === overId)?.status;
}

/**
 * A drop. `overId` is whatever dnd-kit was hovering — a card in some column, or
 * the column itself when the pointer is past the last card or the column is
 * empty — and the answer is the same either way: the task's new column and its
 * new rank between the two cards it landed between.
 *
 * Only the dragged task changes. Everything else keeps the position it had.
 */
export function moveTaskTo(
  tasks: SprintBoardTask[],
  taskId: string,
  overId: string,
): SprintBoardTask[] {
  /* Hovering itself is not a move. Without this the card would be treated as
     dropped on an unknown target and sent to the end of its own column. */
  if (taskId === overId) return tasks;

  const moving = tasks.find((task) => task.id === taskId);
  const status = statusOfDropTarget(tasks, overId);
  if (!moving || !status) return tasks;

  const column = columnTasks(tasks, status);
  const without = column.filter((task) => task.id !== taskId);
  const insertAt = insertionIndex(column, without, taskId, overId);

  const position = positionBetween(
    without[insertAt - 1]?.position,
    without[insertAt]?.position,
  );

  return tasks.map((task) =>
    task.id === taskId ? { ...task, status, position } : task,
  );
}

/**
 * Where the card goes in the column once it has been taken out of it.
 *
 * Dropping ON a card means taking that card's place, so a card moving DOWN its
 * own column lands after the one it was dropped on and a card moving up lands
 * before it — which is the same rule `arrayMove` follows, written out.
 */
function insertionIndex(
  column: SprintBoardTask[],
  without: SprintBoardTask[],
  taskId: string,
  overId: string,
): number {
  const overIndex = without.findIndex((task) => task.id === overId);
  if (overIndex === -1) return without.length;

  const fromIndex = column.findIndex((task) => task.id === taskId);
  const toIndex = column.findIndex((task) => task.id === overId);
  return fromIndex !== -1 && fromIndex < toIndex ? overIndex + 1 : overIndex;
}

/**
 * What the header quotes. Points are counted in the same currency the sprints
 * screen uses: an unestimated task contributes nothing, not zero — see
 * `totalPoints` in `backlog-groups.ts`, which this deliberately agrees with.
 */
export function boardTotals(tasks: SprintBoardTask[]): BoardTotals {
  return tasks.reduce<BoardTotals>(
    (totals, task) => {
      const points = task.storyPoints ?? 0;
      const done = task.status === "done";
      return {
        done: totals.done + (done ? 1 : 0),
        total: totals.total + 1,
        donePoints: totals.donePoints + (done ? points : 0),
        totalPoints: totals.totalPoints + points,
      };
    },
    { done: 0, total: 0, donePoints: 0, totalPoints: 0 },
  );
}

/** The rank a newly composed card takes: last in its column. */
export function endOfColumn(
  tasks: SprintBoardTask[],
  status: SprintStatus,
): number {
  const column = columnTasks(tasks, status);
  return positionBetween(column[column.length - 1]?.position, undefined);
}
