"use client";

import { useState } from "react";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";
import { CreateTile } from "@/components/workspace/create-tile";

/**
 * The client leaf on `/workspaces`. It owns one boolean; the grid and every
 * card around it stay on the server.
 */
export function CreateWorkspaceCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreateTile
        label="Create Workspace"
        description="A new home for a team, its projects and its boards."
        onClick={() => setOpen(true)}
      />
      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
