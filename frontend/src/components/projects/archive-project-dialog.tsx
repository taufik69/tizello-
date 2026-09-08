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

/**
 * The reversible half, in both directions.
 *
 * One dialog rather than an archive/restore pair: the endpoint is one
 * (`PATCH /projects/:id/archive` with a boolean), the question has one shape,
 * and two files would be two places for the copy to drift.
 *
 * The copy is explicit that `status` does not move. Archive and status are
 * independent axes on this model — there is deliberately no `ARCHIVED` status
 * (project.md §*Three independent axes*) — and someone archiving an ACTIVE
 * project should not have to guess whether it silently became something else.
 *
 * The confirm is `outline`, not `danger`: nothing is lost here, and spending
 * the destructive fill on a reversible action leaves nothing louder for delete.
 */
export function ArchiveProjectDialog({
  projectName,
  isArchived,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  projectName: string;
  isArchived: boolean;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby={titleId}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle id={titleId}>
            {isArchived ? "Restore project" : "Archive project"}
          </DialogTitle>
          <DialogDescription>
            {isArchived
              ? `${projectName} goes back into the project list. Nothing about it changed while it was archived.`
              : `${projectName} drops out of the project list. Its status, dates and members stay exactly as they are, and you can restore it at any time from Archived.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isArchived ? "default" : "outline"}
            disabled={pending}
            onClick={onConfirm}
          >
            {isArchived
              ? pending
                ? "Restoring…"
                : "Restore project"
              : pending
                ? "Archiving…"
                : "Archive project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
