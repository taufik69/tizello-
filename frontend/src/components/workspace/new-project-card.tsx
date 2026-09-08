"use client";

import { useState } from "react";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { CreateTile } from "@/components/workspace/create-tile";

/**
 * The client leaf on a workspace detail page. Opens the SAME dialog the
 * projects toolbar does — `CreateEntityDialog` (a bare name field that wrote
 * nowhere) is no longer what this needs, and two create paths that disagree
 * about which fields a project has is how one of them silently stops sending
 * a status.
 */
export function NewProjectCard({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreateTile
        label="New Project"
        description="Group related boards and tasks together."
        onClick={() => setOpen(true)}
      />
      <CreateProjectDialog
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
