"use client";

import { useState } from "react";
import { DeleteTaskDialog } from "@/components/backlog/delete-task-dialog";
import { BoardCanvas } from "@/components/sprint-board/board-canvas";
import { BoardTaskDialog } from "@/components/sprint-board/board-task-dialog";
import { BoardToolbar } from "@/components/sprint-board/board-toolbar";
import { CompleteSprintDialog } from "@/components/sprint-board/complete-sprint-dialog";
import { nextTaskId } from "@/lib/backlog-groups";
import {
  boardTaskFromDraft,
  emptyBoardDraft,
  removeBoardTask,
  upsertBoardTask,
} from "@/lib/board-task-edit";
import { boardTotals } from "@/lib/sprint-board";
import type { SprintStatus } from "@/types/board";
import type { ProjectPerson } from "@/types/project";
import type { SprintRecord } from "@/types/sprint";
import type { BoardTaskDraft, SprintBoardTask } from "@/types/sprint-board";

/*
 * The interactive half of the sprint board. The page above stays a Server
 * Component and hands the sprint's cards down as props; this leaf owns what a
 * static tree cannot: the board as dragged, which card the detail panel is open
 * on, and the two confirms.
 *
 * NOTHING PERSISTS. There is no API and no Server Action behind any of this —
 * every drag, edit and delete lives in `useState` and is gone on refresh.
 * `lib/sprint-board.ts` is already shaped like the payload a `PATCH /tasks/:id`
 * would take, so wiring it later is a body swap rather than a rewrite.
 *
 * `editorKey` remounts `BoardTaskDialog` on every open, which is how the draft
 * is seeded from the card without an effect syncing props into state. It
 * changes only while the dialog is closed, so the close path keeps one instance
 * alive and the browser still restores focus to whatever opened it.
 */
export function SprintBoardPanel({
  sprint,
  tasks: initial,
  assignees,
}: {
  sprint: SprintRecord;
  /** The ACTIVE sprint's cards, and only those. */
  tasks: SprintBoardTask[];
  assignees: ProjectPerson[];
}) {
  const [tasks, setTasks] = useState(initial);
  const [editing, setEditing] = useState<SprintBoardTask | null>(null);
  const [composeIn, setComposeIn] = useState<SprintStatus>("todo");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [pendingDeletion, setPendingDeletion] =
    useState<SprintBoardTask | null>(null);
  const [completing, setCompleting] = useState(false);

  const totals = boardTotals(tasks);

  function openEditor(task: SprintBoardTask | null, status: SprintStatus) {
    setEditing(task);
    setComposeIn(status);
    setEditorKey((key) => key + 1);
    setEditorOpen(true);
  }

  function save(draft: BoardTaskDraft) {
    setTasks((current) => {
      /* Editing keeps the id — it is printed on the card and in the accessible
         name of every control on it. Composing takes the next in sequence. */
      const id = editing?.id ?? nextTaskId(current);
      return upsertBoardTask(
        current,
        boardTaskFromDraft(draft, {
          id,
          assignees,
          sprintId: sprint.id,
          tasks: current,
          previous: editing,
        }),
      );
    });
  }

  /* The column composer: a title, everything else left at its default, filed at
     the bottom of the column it was typed into. */
  function quickAdd(status: SprintStatus, title: string) {
    setTasks((current) =>
      upsertBoardTask(
        current,
        boardTaskFromDraft(
          { ...emptyBoardDraft(status), title },
          {
            id: nextTaskId(current),
            assignees: [],
            sprintId: sprint.id,
            tasks: current,
            previous: null,
          },
        ),
      ),
    );
  }

  return (
    <>
      <BoardToolbar
        totals={totals}
        state={sprint.state}
        onAddTask={() => openEditor(null, "todo")}
        onCompleteSprint={() => setCompleting(true)}
      />

      <BoardCanvas
        tasks={tasks}
        setTasks={setTasks}
        onOpen={(task) => openEditor(task, task.status)}
        onQuickAdd={quickAdd}
      />

      <BoardTaskDialog
        key={editorKey}
        open={editorOpen}
        task={editing}
        fallbackStatus={composeIn}
        assignees={assignees}
        onOpenChange={setEditorOpen}
        onSave={save}
        onDelete={(task) => {
          /* One modal at a time: the editor closes and the confirm takes its
             place, rather than stacking a dialog on a dialog. */
          setEditorOpen(false);
          setPendingDeletion(task);
        }}
      />

      <DeleteTaskDialog
        task={pendingDeletion}
        container="this sprint"
        onOpenChange={() => setPendingDeletion(null)}
        onConfirm={() => {
          setTasks((current) =>
            removeBoardTask(current, pendingDeletion?.id ?? ""),
          );
          setPendingDeletion(null);
        }}
      />

      <CompleteSprintDialog
        sprint={completing ? sprint : null}
        totals={totals}
        onOpenChange={() => setCompleting(false)}
        onConfirm={() => setCompleting(false)}
      />
    </>
  );
}
