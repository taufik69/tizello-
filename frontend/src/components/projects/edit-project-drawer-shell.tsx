"use client";

import { EditProjectDrawer } from "@/components/projects/edit-project-drawer";
import { Drawer } from "@/components/ui/drawer";
import type { ProjectRecord } from "@/types/project";
import type { ProjectPropertyDef } from "@/types/project-property";

/**
 * The shell stays mounted whether it is open or not, because the native
 * `<dialog>` is what hands focus back to the trigger when it closes;
 * unmounting it would drop focus on the `<body>`. The FORM inside is remounted
 * instead, keyed on `updatedAt` and on `open`.
 */
export function EditProjectDrawerShell({
  project,
  workspaceId,
  today,
  definitions,
  canManageProperties,
  meta,
  open,
  onOpenChange,
}: {
  project: ProjectRecord;
  workspaceId: string;
  today: string;
  definitions: ProjectPropertyDef[];
  canManageProperties: boolean;
  /** The read-only facts block — see `EditProjectDrawer`. */
  meta?: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} aria-label="Edit project">
      <EditProjectDrawer
        key={`${project.updatedAt}-${open}`}
        project={project}
        workspaceId={workspaceId}
        today={today}
        definitions={definitions}
        canManageProperties={canManageProperties}
        meta={meta}
        onClose={() => onOpenChange(false)}
      />
    </Drawer>
  );
}
