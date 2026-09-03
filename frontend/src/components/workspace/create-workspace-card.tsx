"use client";

import { useState } from "react";
import { CreateEntityDialog } from "@/components/workspace/create-entity-dialog";
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
      <CreateEntityDialog
        open={open}
        onOpenChange={setOpen}
        title="Create Workspace"
        description="Workspaces hold your projects and the people working on them. You can rename it later."
        fieldLabel="Workspace name"
        placeholder="e.g. Northwind Studio"
        submitLabel="Create Workspace"
        emptyMessage="Give your workspace a name."
      />
    </>
  );
}
