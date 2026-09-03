"use client";

import { useId, useState } from "react";
import { TaskChoiceGroup, type Choice } from "@/components/backlog/task-choice-group";
import { TaskFormFields } from "@/components/backlog/task-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import { draftFromBoardTask } from "@/lib/board-task-edit";
import { BOARD_COLUMNS } from "@/lib/sprint-board";
import { SPRINT_STATUSES, type SprintStatus } from "@/types/board";
import type { ProjectPerson } from "@/types/project";
import type { BoardTaskDraft, SprintBoardTask } from "@/types/sprint-board";

/*
 * The card detail panel. A modal rather than a slide-over, because that is what
 * every other editor in this app already is — the backlog's `TaskDialog`, which
 * this deliberately mirrors field for field, plus the one thing only a board
 * has: the column.
 *
 * MOVING THE CARD IS MOVING ITS STATUS. The column control writes `status`, the
 * same field a drag writes, so there is nothing here that can disagree with
 * where the card sits.
 *
 * The draft is seeded from `task` at MOUNT; the panel above remounts this on
 * every open with a changing `key`, which is what makes that correct without an
 * effect syncing props into state.
 *
 * Validation is client-side ONLY and nothing persists.
 */
const EMPTY_TITLE = "Give the card a title.";

const COLUMN_CHOICES: Choice[] = BOARD_COLUMNS.map((column) => ({
  value: column.status,
  label: column.title,
}));

export function BoardTaskDialog({
  open,
  task,
  fallbackStatus,
  assignees,
  onOpenChange,
  onSave,
  onDelete,
}: {
  open: boolean;
  /** `null` when composing a new card. */
  task: SprintBoardTask | null;
  /** The column a new card lands in — whichever composer opened the editor. */
  fallbackStatus: SprintStatus;
  assignees: ProjectPerson[];
  onOpenChange: (open: boolean) => void;
  onSave: (draft: BoardTaskDraft) => void;
  onDelete: (task: SprintBoardTask) => void;
}) {
  const titleId = useId();
  const columnName = useId();
  const priorityName = useId();
  const pointsName = useId();
  const [draft, setDraft] = useState<BoardTaskDraft>(() =>
    draftFromBoardTask(task, fallbackStatus),
  );
  const [error, setError] = useState<string | undefined>();

  function patch(next: Partial<BoardTaskDraft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError(EMPTY_TITLE);
      return;
    }
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby={titleId} className="max-w-lg">
      {/* noValidate: the browser's bubble would pre-empt the inline error, and
          the inline one is the house treatment. */}
      <form onSubmit={submit} noValidate>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>
              {task ? `${task.id} — details` : "New card"}
            </DialogTitle>
            <DialogDescription>
              {task
                ? "Changes apply to this card only, and the column is its status."
                : "It joins this sprint in the column you pick, not the backlog."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <TextField
              label="Title"
              name="title"
              placeholder="Mega-menu on desktop"
              autoComplete="off"
              defaultValue={draft.title}
              error={error}
              validate={(value) => (value.trim() ? null : EMPTY_TITLE)}
              onValueChange={(title) => {
                /* A submit error outranks the field's own, so it has to be
                   cleared by hand once the user starts fixing it. */
                setError(undefined);
                patch({ title });
              }}
            />

            <TaskChoiceGroup
              legend="Column"
              name={columnName}
              choices={COLUMN_CHOICES}
              value={draft.status}
              hint="Where the card sits is what its status is."
              onChange={(value) => {
                /* Narrowed against the canonical list rather than cast: a
                   radio's value arrives as a plain string. */
                const status = SPRINT_STATUSES.find((entry) => entry === value);
                if (status) patch({ status });
              }}
            />

            <TaskFormFields
              draft={draft}
              assignees={assignees}
              priorityName={priorityName}
              pointsName={pointsName}
              onChange={patch}
            />
          </div>

          <DialogFooter className="mt-5 sm:justify-between">
            {task ? (
              <Button variant="ghost" onClick={() => onDelete(task)}>
                Delete card
              </Button>
            ) : (
              <span />
            )}

            <span className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{task ? "Save changes" : "Add card"}</Button>
            </span>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
