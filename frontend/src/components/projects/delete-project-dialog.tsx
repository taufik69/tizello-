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
 * The irreversible half.
 *
 * The API's delete is a SOFT one — it stamps `deletedAt` and the row survives
 * for a purge job that does not exist yet (project.md §*Open questions* 3) —
 * but every read in the project repository filters `deletedAt: null`
 * unconditionally, so nothing in this app can fetch it again. The copy
 * therefore says "permanently", which is what is true for the person reading
 * it, and points at Archive for the reversible option.
 *
 * Type-to-confirm on the KEY, not the name: it is short, it is unique within
 * the workspace, and it is what the row was already showing. Asking for a
 * 52-character project name would push people to paste, which is exactly the
 * reflex the confirmation exists to interrupt. Matching is trimmed and
 * case-insensitive — the key is uppercase by construction, so rejecting
 * lowercase would fail someone who typed the right thing.
 */
export function DeleteProjectDialog({
  projectName,
  projectKey,
  open,
  pending,
  onOpenChange,
  onConfirm,
}: {
  projectName: string;
  projectKey: string;
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
        projectName={projectName}
        projectKey={projectKey}
        pending={pending}
        onCancel={() => onOpenChange(false)}
        onConfirm={onConfirm}
      />
    </Dialog>
  );
}

function DeleteConfirmation({
  titleId,
  projectName,
  projectKey,
  pending,
  onCancel,
  onConfirm,
}: {
  titleId: string;
  projectName: string;
  projectKey: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [confirmation, setConfirmation] = useState("");
  const armed = confirmation.trim().toUpperCase() === projectKey.toUpperCase();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle id={titleId}>Delete project</DialogTitle>
        <DialogDescription>
          {projectName} and everything in it go away permanently. This cannot be
          undone, and the key {projectKey} does not come back — every task id
          that already carries it is orphaned. To keep the project but hide it,
          archive it instead.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4">
        <TextField
          label={`Type ${projectKey} to confirm`}
          name="confirmation"
          autoComplete="off"
          placeholder={projectKey}
          transform={(value) => value.toUpperCase()}
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
