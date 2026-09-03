"use client";

import { useId, useState } from "react";
import { SprintFormFields } from "@/components/sprints/sprint-form-fields";
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
import {
  NAME_REQUIRED,
  draftFromSprint,
  validateDraft,
  type SprintDraftErrors,
} from "@/lib/sprint-edit";
import type { SprintDraft, SprintRecord } from "@/types/sprint";

/*
 * New sprint and Edit sprint are one dialog: the fields are identical and the
 * only difference is the copy and whether an id already exists.
 *
 * The draft is seeded at MOUNT. The panel above remounts this component every
 * time the editor opens (a changing `key`), which is what makes that correct
 * without an effect syncing props into state — and the instance survives the
 * close, so the browser still hands focus back to whatever opened it.
 *
 * Validation is client-side ONLY and is a convenience, nothing more. Nothing
 * persists: the parent keeps the result in `useState` and a refresh restores
 * the fixture.
 */
export function SprintDialog({
  open,
  sprint,
  blankDraft,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  /** `null` when creating. */
  sprint: SprintRecord | null;
  /** What a new sprint starts as — next name, today, today + two weeks. */
  blankDraft: SprintDraft;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: SprintDraft) => void;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState<SprintDraft>(() =>
    draftFromSprint(sprint, blankDraft),
  );
  const [errors, setErrors] = useState<SprintDraftErrors>({});

  function patch(next: Partial<SprintDraft>) {
    const merged = { ...draft, ...next };
    setDraft(merged);
    /* Once a message is on screen it re-checks on every keystroke, so it clears
       the moment it is fixed. Before that it stays quiet — validating a field
       nobody has finished typing is the behaviour `text-field.tsx` documents
       avoiding. */
    if (errors.name || errors.endDate) setErrors(validateDraft(merged));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validateDraft(draft);
    if (found.name || found.endDate) {
      setErrors(found);
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
              {sprint ? `Edit ${sprint.id}` : "New sprint"}
            </DialogTitle>
            <DialogDescription>
              {sprint
                ? "Changes apply to this sprint only. What is in it does not move."
                : "It starts in Planning. Starting it is a separate, deliberate step."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <TextField
              label="Name"
              name="name"
              placeholder="Sprint 16"
              autoComplete="off"
              defaultValue={draft.name}
              error={errors.name}
              validate={(value) => (value.trim() ? null : NAME_REQUIRED)}
              onValueChange={(name) => patch({ name })}
            />

            <SprintFormFields
              draft={draft}
              error={errors.endDate}
              onChange={patch}
            />
          </div>

          <DialogFooter className="mt-5">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {sprint ? "Save changes" : "Create sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
