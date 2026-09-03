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
import type { PendingInvitation } from "@/types/workspace";

/**
 * Destructive confirmation, the same anatomy as `RemoveMemberDialog`: it names
 * the address — "Are you sure?" on its own is not a question anyone can answer
 * — and the confirm carries the `danger` fill so the safe choice is the quiet
 * one.
 *
 * `invitation` is null when nothing is pending, which is also what closes it.
 */
export function CancelInviteDialog({
  invitation,
  workspaceName,
  onOpenChange,
  onConfirm,
}: {
  invitation: PendingInvitation | null;
  workspaceName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Dialog
      open={invitation !== null}
      onOpenChange={onOpenChange}
      aria-labelledby={titleId}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle id={titleId}>Cancel invite</DialogTitle>
          <DialogDescription>
            The link sent to {invitation?.email} will stop working, and they
            will not be able to join {workspaceName}. You can invite them again
            at any time.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep invite
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Cancel invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
