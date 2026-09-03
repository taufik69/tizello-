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
import type { BacklogTask } from "@/types/backlog";

/**
 * Destructive confirmation, modelled on `RemoveMemberDialog`. It names the task
 * — "Are you sure?" on its own is not a question anyone can answer — and the
 * confirm carries the `danger` fill so the safe choice is the quiet one.
 *
 * `task` is null when nothing is pending, which is also what closes it.
 */
export function DeleteTaskDialog({
  task,
  container = "the backlog",
  onOpenChange,
  onConfirm,
}: {
  task: BacklogTask | null;
  /**
   * Where the task is being deleted FROM, named in the sentence. The sprint
   * board deletes the same task out of a running sprint, and "leaves the
   * backlog" would be the wrong thing to agree to there.
   */
  container?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Dialog
      open={task !== null}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle id={titleId}>Delete task</DialogTitle>
          <DialogDescription>
            {task?.id} &mdash; &ldquo;{task?.title}&rdquo; leaves {container}{" "}
            for good. There is no undo.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
