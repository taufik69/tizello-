"use client";

import { Dialog } from "@/components/ui/dialog";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import type { ProjectRecord } from "@/types/project";

/**
 * Update a project: name, description, status, priority, dates, icon, colour.
 *
 * The `Dialog` itself stays mounted whether it is open or not, because the
 * native `<dialog>` is what hands focus back to the trigger when it closes;
 * unmounting it would drop focus on the `<body>`. The FORM inside is remounted
 * instead, keyed on the project's `updatedAt` and on `open` — reopening after a
 * cancelled edit shows the stored values, not the abandoned ones, and
 * reopening after a save shows what was just written.
 */
export function EditProjectDialog({
  project,
  workspaceId,
  open,
  onOpenChange,
}: {
  project: ProjectRecord;
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-label="Edit project">
      <EditProjectForm
        key={`${project.updatedAt}-${open}`}
        project={project}
        workspaceId={workspaceId}
        onClose={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
