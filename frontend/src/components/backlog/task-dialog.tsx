"use client";

import { useId, useState } from "react";
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
import { draftFromTask } from "@/lib/backlog-edit";
import type { BacklogTask, TaskDraft } from "@/types/backlog";
import type { ProjectPerson } from "@/types/project";

/*
 * New task and Edit task are one dialog: the fields are identical and the only
 * difference is the copy and whether an id already exists.
 *
 * The draft is seeded from `task` at MOUNT. The panel above remounts this
 * component every time the editor opens (a changing `key`), which is what makes
 * that correct without an effect that syncs props into state — and the instance
 * survives the close, so the browser still hands focus back to whatever opened
 * it.
 *
 * Validation is client-side ONLY and is a convenience, nothing more. Nothing
 * persists: the parent keeps the result in `useState` and a refresh restores
 * the fixture.
 */
const EMPTY_TITLE = "Give the task a title.";

export function TaskDialog({
  open,
  task,
  assignees,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  /** `null` when creating. */
  task: BacklogTask | null;
  assignees: ProjectPerson[];
  onOpenChange: (open: boolean) => void;
  onSave: (draft: TaskDraft) => void;
}) {
  const titleId = useId();
  const priorityName = useId();
  const pointsName = useId();
  const [draft, setDraft] = useState<TaskDraft>(() => draftFromTask(task));
  const [error, setError] = useState<string | undefined>();

  function patch(next: Partial<TaskDraft>) {
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
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
      className="max-w-lg"
    >
      {/* noValidate: the browser's bubble would pre-empt the inline error, and
          the inline one is the house treatment. */}
      <form onSubmit={submit} noValidate>
        <DialogContent>
          <DialogHeader>
            <DialogTitle id={titleId}>
              {task ? `Edit ${task.id}` : "New task"}
            </DialogTitle>
            <DialogDescription>
              {task
                ? "Changes apply to this task only."
                : "It lands in the backlog. Planning is what pulls it into a sprint."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <TextField
              label="Title"
              name="title"
              placeholder="Rebuild the marketing nav"
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

            <TaskFormFields
              draft={draft}
              assignees={assignees}
              priorityName={priorityName}
              pointsName={pointsName}
              onChange={patch}
            />
          </div>

          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
