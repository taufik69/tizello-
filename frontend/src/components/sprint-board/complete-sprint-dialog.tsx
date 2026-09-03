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
import type { BoardTotals } from "@/types/sprint-board";

/*
 * The confirm on the one operation that empties this board.
 *
 * Closing a sprint is not a filter: per `.claude/rules/workflow.md` the Done
 * column becomes the sprint's record and everything still in To do or In
 * progress goes back to the backlog. So the dialog counts both halves before
 * anyone agrees to it — "and 5 return to the backlog" is the sentence that
 * makes it a decision rather than a button.
 *
 * IT IS VISUAL ONLY. `closeSprint` in `lib/sprint.ts` is written, correct and
 * still uncalled; wiring this confirm to it is a body swap in the panel above,
 * not a rewrite here. The confirm therefore takes the brand fill rather than
 * `danger` — nothing is destroyed, work moves.
 */
export function CompleteSprintDialog({
  sprint,
  totals,
  onOpenChange,
  onConfirm,
}: {
  /** `null` when nothing is pending, which is also what closes it. */
  sprint: SprintRecord | null;
  totals: BoardTotals;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const returning = totals.total - totals.done;

  return (
    <Dialog
      open={sprint !== null}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle id={titleId}>
            {sprint ? `Complete ${sprint.name}?` : "Complete this sprint?"}
          </DialogTitle>
          <DialogDescription>
            {plural(totals.done, "card", "cards")} in Done
            {totals.donePoints > 0 && ` (${totals.donePoints} pts)`} close with
            the sprint.{" "}
            {returning > 0
              ? `The other ${plural(returning, "card", "cards")} go back to the backlog, keeping their labels, estimates and assignees.`
              : "Nothing is left over, so the backlog is untouched."}{" "}
            There is no reopening a completed sprint.
          </DialogDescription>
        </DialogHeader>

        <p className="mt-3 rounded-sm bg-warning-subtle px-2.5 py-2 text-xs text-text-muted">
          Closing a sprint is not wired up yet, so this confirm changes nothing.
        </p>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Complete sprint</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
