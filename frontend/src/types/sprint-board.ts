import type { BacklogTask, TaskDraft } from "@/types/backlog";
import type { SprintStatus } from "@/types/board";

/*
 * A task as the SPRINT BOARD knows it — one of the ACTIVE sprint's tasks, in
 * one of the three fixed columns, at a place in that column.
 *
 * WHY THIS EXTENDS `BacklogTask` RATHER THAN REDECLARING IT
 * --------------------------------------------------------
 * It is the same task. Planning moved it out of the backlog and into a sprint
 * (`sprintId`), and the board is the screen that runs it; the id, title,
 * priority, estimate, assignee and labels are unchanged, so re-typing them here
 * would be a second shape for one thing. Two fields are added, and they are the
 * two the backlog has no use for:
 *
 * `status` IS the column. There is no nesting and no second field: the board
 * renders `tasks.filter(t => t.status === column)`, so a card's column and its
 * status cannot disagree — which is what `.claude/rules/workflow.md` means by
 * "status lives on the list, not the card". Moving a card between columns is
 * the status change, and nothing else needs to be written.
 *
 * `position` is a FLOAT rank inside the column, not an array index. Dropping a
 * card between two neighbours averages their positions, so one row changes and
 * the rest of the column is untouched — no renumbering pass, and the same write
 * a real `PATCH /tasks/:id` would take.
 */
export type SprintBoardTask = BacklogTask & {
  /** Which of the three columns the task sits in. Membership is the status. */
  status: SprintStatus;
  /** Rank within the column, ascending. Floats, so inserts never renumber. */
  position: number;
};

/**
 * The editor's working copy — `TaskDraft` plus the column, because the detail
 * panel can move a task without dragging it. Flat and all-strings for the same
 * reason `TaskDraft` is: a form holds ids, not objects.
 */
export type BoardTaskDraft = TaskDraft & { status: SprintStatus };

/** Done / total, in both currencies the header quotes. */
export type BoardTotals = {
  done: number;
  total: number;
  donePoints: number;
  totalPoints: number;
};
