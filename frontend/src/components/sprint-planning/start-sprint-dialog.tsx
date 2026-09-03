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
import { formatDate } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import { isOverCapacity } from "@/lib/sprint-planning";
import type { SprintRecord } from "@/types/sprint";

/*
 * The confirm on the one irreversible thing this screen does. Starting is not
 * destructive, so the confirm is the brand fill rather than `danger` — the same
 * bargain `SprintTransitionDialog` strikes, which this dialog deliberately
 * echoes in shape while saying the extra thing planning knows: how much work is
 * in the box.
 *
 * THE SINGLE-ACTIVE RULE IS REAL. `startSprint` refuses while another sprint is
 * running, so when one is, the dialog says which and the confirm is disabled
 * rather than firing into a no-op. Opening it anyway is the point: "why can't I
 * start this?" is answered here, in the place the question is asked.
 */
export function StartSprintDialog({
  sprint,
  count,
  points,
  blockedBy,
  onOpenChange,
  onConfirm,
}: {
  /** `null` when nothing is pending, which is also what closes it. */
  sprint: SprintRecord | null;
  count: number;
  points: number;
  /** The sprint already running, if there is one. */
  blockedBy?: SprintRecord;
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
          <DialogTitle id={titleId}>
            {sprint ? `Start ${sprint.name}?` : "Start this sprint?"}
          </DialogTitle>
          <DialogDescription>
            {sprint && (
              <>
                It runs {formatDate(sprint.startDate)} to{" "}
                {formatDate(sprint.endDate)} with{" "}
                {plural(count, "item", "items")} and{" "}
                {sprint.capacityPoints === undefined
                  ? plural(points, "point", "points")
                  : `${points} of ${sprint.capacityPoints} points`}{" "}
                planned. Starting makes it the one active sprint, and there is
                no reopening it.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {sprint && isOverCapacity(points, sprint.capacityPoints) && (
          <p className="mt-3 rounded-sm bg-warning-subtle px-2.5 py-2 text-xs text-text-muted">
            That is over the capacity this sprint was planned against. Nothing
            stops you &mdash; it is a forecast, not a limit.
          </p>
        )}

        {blockedBy && (
          <p className="mt-3 rounded-sm bg-danger-subtle px-2.5 py-2 text-xs text-text-muted">
            <span className="font-semibold text-text">{blockedBy.name}</span> is
            still running. One sprint runs at a time, so complete it on the
            sprints screen before starting this one.
          </p>
        )}

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={blockedBy !== undefined}>
            Start sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
