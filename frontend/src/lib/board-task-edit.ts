import { EMPTY_DRAFT, draftFromTask, taskFromDraft } from "@/lib/backlog-edit";
import { endOfColumn } from "@/lib/sprint-board";
import type { SprintStatus } from "@/types/board";
import type { ProjectPerson } from "@/types/project";
import type { BoardTaskDraft, SprintBoardTask } from "@/types/sprint-board";

/*
 * Turning a board task into a form and a form back into a board task.
 *
 * Everything the two shapes have in common goes through `backlog-edit.ts` —
 * it already flattens a task into a draft and re-inflates it, and a second copy
 * of that would drift the moment the editor gained a field. This module adds
 * only what the board knows: the column, and the rank inside it.
 *
 * NOTHING HERE PERSISTS. The board holds the result in `useState`.
 */

/** A blank card, filed into the column whose composer opened the editor. */
export function emptyBoardDraft(status: SprintStatus): BoardTaskDraft {
  return { ...EMPTY_DRAFT, status };
}

/** The editor's starting value: an existing card flattened, or a blank one. */
export function draftFromBoardTask(
  task: SprintBoardTask | null,
  fallback: SprintStatus,
): BoardTaskDraft {
  if (!task) return emptyBoardDraft(fallback);
  return { ...draftFromTask(task), status: task.status };
}

/**
 * A draft, re-inflated.
 *
 * `sprintId` is the board's sprint rather than `null`: `taskFromDraft` files
 * everything it makes into the backlog, which is right for the backlog screen
 * and wrong here — a card composed on a running sprint's board is in that
 * sprint. It is the one field this override exists for.
 *
 * An existing card keeps its rank unless the editor moved it to another column,
 * in which case it goes to the bottom of the new one — the same place the drag
 * would have put it if it had been dropped past the last card.
 */
export function boardTaskFromDraft(
  draft: BoardTaskDraft,
  {
    id,
    assignees,
    sprintId,
    tasks,
    previous,
  }: {
    id: string;
    assignees: ProjectPerson[];
    sprintId: string;
    tasks: SprintBoardTask[];
    /** The card being edited, or `null` when composing a new one. */
    previous: SprintBoardTask | null;
  },
): SprintBoardTask {
  const keepsPosition = previous !== null && previous.status === draft.status;

  return {
    ...taskFromDraft(draft, { id, assignees }),
    sprintId,
    status: draft.status,
    position: keepsPosition ? previous.position : endOfColumn(tasks, draft.status),
  };
}

/** Replaces the card with the same id, or appends when there is none. */
export function upsertBoardTask(
  tasks: SprintBoardTask[],
  task: SprintBoardTask,
): SprintBoardTask[] {
  const exists = tasks.some((current) => current.id === task.id);
  return exists
    ? tasks.map((current) => (current.id === task.id ? task : current))
    : [...tasks, task];
}

export function removeBoardTask(
  tasks: SprintBoardTask[],
  id: string,
): SprintBoardTask[] {
  return tasks.filter((task) => task.id !== id);
}
