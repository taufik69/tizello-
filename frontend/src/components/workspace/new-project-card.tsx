"use client";

import { useState } from "react";
import { CreateEntityDialog } from "@/components/workspace/create-entity-dialog";
import { CreateTile } from "@/components/workspace/create-tile";

/** The client leaf on a workspace detail page. Same shape as the workspace one. */
export function NewProjectCard({ workspaceName }: { workspaceName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreateTile
        label="New Project"
        description="Group related boards and tasks together."
        onClick={() => setOpen(true)}
      />
      <CreateEntityDialog
        open={open}
        onOpenChange={setOpen}
        title="New project"
        description={`This project will live in ${workspaceName}.`}
        fieldLabel="Project name"
        placeholder="e.g. Website redesign"
        submitLabel="Create Project"
        emptyMessage="Give your project a name."
      />
    </>
  );
}
