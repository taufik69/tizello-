"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { plural } from "@/lib/plural";
import type { SprintRecord } from "@/types/sprint";

/**
 * Destructive confirmation, modelled on `DeleteTaskDialog`. It names the sprint
 * — "Are you sure?" on its own is not a question anyone can answer — and the
 * confirm carries the `danger` fill so the safe choice is the quiet one.
 *
 * It also says what happens to the work inside, because that is the part a
 * sprint delete puts at risk and the part nobody thinks about until afterwards.
 *
 * `sprint` is null when nothing is pending, which is also what closes it.
 */
export function DeleteSprintDialog({
  sprint,
  onOpenChange,
  onConfirm,
}: {
  sprint: SprintRecord | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Dialog
      open={sprint !== null}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle id={titleId}>Delete sprint</DialogTitle>
          <DialogDescription>
            {sprint?.id} &mdash; &ldquo;{sprint?.name}&rdquo; is removed for
            good. There is no undo.
            {sprint && sprint.itemCount > 0 && (
              <>
                {" "}
                The {plural(sprint.itemCount, "task", "tasks")} planned into it
                return to the backlog.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
