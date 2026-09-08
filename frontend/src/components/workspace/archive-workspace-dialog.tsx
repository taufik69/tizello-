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
 * The reversible half of feature 4, in both directions.
 *
 * One dialog rather than an archive/restore pair: the endpoint is one
 * (`PATCH /workspaces/:id/archive` with a boolean), the shape of the question
 * is one, and two files would be two places for the copy to drift. `isArchived`
 * is the workspace's state NOW, so the dialog offers the opposite of it.
 *
 * The confirm is `outline`, not `danger`: nothing is lost here, and spending
 * the destructive fill on a reversible action leaves nothing louder for the
 * delete dialog to use.
 */
export function ArchiveWorkspaceDialog({
  workspaceName,
  isArchived,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  workspaceName: string;
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
            {isArchived ? "Restore workspace" : "Archive workspace"}
          </DialogTitle>
          <DialogDescription>
            {isArchived
              ? `${workspaceName} goes back into your workspace list. Nothing about it changed while it was archived.`
              : `${workspaceName} drops out of your workspace list and its projects, boards and members stay exactly as they are. You can restore it at any time from Archived.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={isArchived ? "default" : "outline"} disabled={pending} onClick={onConfirm}>
            {isArchived
              ? pending
                ? "Restoring…"
                : "Restore workspace"
              : pending
                ? "Archiving…"
                : "Archive workspace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
