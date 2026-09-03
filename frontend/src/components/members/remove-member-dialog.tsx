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
import type { WorkspaceMember } from "@/types/workspace";

/**
 * Destructive confirmation. It names the person — "Are you sure?" on its own
 * is not a question anyone can answer — and the confirm carries the `danger`
 * fill so the safe choice is the quiet one.
 *
 * `member` is null when nothing is pending, which is also what closes it.
 */
export function RemoveMemberDialog({
  member,
  workspaceName,
  onOpenChange,
  onConfirm,
}: {
  member: WorkspaceMember | null;
  workspaceName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Dialog
      open={member !== null}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle id={titleId}>Remove member</DialogTitle>
          <DialogDescription>
            {member?.name} will lose access to {workspaceName}. Their tasks and
            comments stay where they are.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Remove member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
