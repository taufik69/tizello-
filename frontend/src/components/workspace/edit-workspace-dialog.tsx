"use client";

import { Dialog } from "@/components/ui/dialog";
import { EditWorkspaceForm } from "@/components/workspace/edit-workspace-form";
import type { Workspace } from "@/types/workspace";

/**
 * Feature 3 — update a workspace: name, description, icon and colour.
 *
 * The `Dialog` itself stays mounted whether it is open or not, because the
 * native `<dialog>` is what hands focus back to the trigger when it closes;
 * unmounting it would drop focus on the `<body>`. The FORM inside is remounted
 * instead, keyed on the workspace's `updatedAt` and on `open`, which is what
 * re-seeds the two uncontrolled fields — reopening after a cancelled edit shows
 * the stored values, not the abandoned ones, and reopening after a save shows
 * what was just written.
 */
export function EditWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
}: {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-label="Edit workspace">
      <EditWorkspaceForm
        key={`${workspace.updatedAt}-${open}`}
        workspace={workspace}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
