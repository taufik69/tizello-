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
import type { SprintRecord } from "@/types/sprint";

/*
 * The two state changes share a dialog, because they are the same question
 * asked twice: "this is what it will do — go ahead?".
 *
 * Neither is destructive, so neither confirm is `danger` — the brand fill is
 * the affirmative here, and `DeleteSprintDialog` keeps red for the one action
 * that loses something. Both ARE one-way, which is what the body says out loud;
 * there is no reopen in this workflow.
 */
export type SprintTransition = "START" | "COMPLETE";

const TITLE: Record<SprintTransition, string> = {
  START: "Start this sprint?",
  COMPLETE: "Complete this sprint?",
};

const CONFIRM: Record<SprintTransition, string> = {
  START: "Start sprint",
  COMPLETE: "Complete sprint",
};

function body(transition: SprintTransition, sprint: SprintRecord) {
  if (transition === "START") {
    return `${sprint.name} runs ${formatDate(sprint.startDate)} to ${formatDate(
      sprint.endDate,
    )} and becomes the one active sprint. Nothing else can start until it is completed.`;
  }

  return `${sprint.doneCount} of ${plural(
    sprint.itemCount,
    "item",
    "items",
  )} are done. Completing ${sprint.name} closes it for good — finished work stays as its record, anything unfinished goes back to the backlog.`;
}

export function SprintTransitionDialog({
  sprint,
  transition,
  onOpenChange,
  onConfirm,
}: {
  /** `null` when nothing is pending, which is also what closes it. */
  sprint: SprintRecord | null;
  transition: SprintTransition;
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
          <DialogTitle id={titleId}>{TITLE[transition]}</DialogTitle>
          <DialogDescription>
            {sprint && body(transition, sprint)}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>{CONFIRM[transition]}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
