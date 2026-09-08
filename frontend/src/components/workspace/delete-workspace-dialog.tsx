"use client";

import { useId, useState } from "react";
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

/**
 * The irreversible half of feature 4.
 *
 * The API's delete is a SOFT one — it stamps `deletedAt` and the row survives
 * for a purge job — but every read in the workspace repository filters
 * `deletedAt: null` unconditionally, so nothing in this app can fetch it again.
 * The copy therefore says "permanently", which is what is true for the person
 * reading it, and points at Archive for the reversible option.
 *
 * Type-to-confirm, not a bare "Are you sure?": this is the one action on the
 * screen that cannot be walked back, and the workspace next to it in the menu
 * is one keystroke away. Matching is exact — a trimmed comparison against the
 * name, so a trailing space from a paste does not block someone who typed the
 * right thing.
 */
export function DeleteWorkspaceDialog({
  workspaceName,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  workspaceName: string;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const titleId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby={titleId}>
      {/* Remounted on every open so a half-typed confirmation from a dialog
          someone escaped out of can never arm the button next time. */}
      <DeleteConfirmation
        key={String(open)}
        titleId={titleId}
        workspaceName={workspaceName}
        pending={pending}
        onCancel={() => onOpenChange(false)}
        onConfirm={onConfirm}
      />
    </Dialog>
  );
}

function DeleteConfirmation({
  titleId,
  workspaceName,
  pending,
  onCancel,
  onConfirm,
}: {
  titleId: string;
  workspaceName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const armed = confirmation.trim() === workspaceName;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle id={titleId}>Delete workspace</DialogTitle>
        <DialogDescription>
          {workspaceName} and everything in it — projects, boards, tasks and
          every membership — go away permanently. This cannot be undone. To keep
          it but hide it, archive it instead.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        <TextField
          label={`Type ${workspaceName} to confirm`}
          name="confirmation"
          autoComplete="off"
          placeholder={workspaceName}
          onValueChange={setConfirmation}
        />
      </div>

      <DialogFooter className="mt-5">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" disabled={!armed || pending} onClick={onConfirm}>
          {pending ? "Deleting…" : "Delete permanently"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
