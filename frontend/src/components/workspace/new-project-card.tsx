"use client";

import type { ProjectScope } from "@/components/projects/project-properties";
import { useState } from "react";
import { CreateProjectDrawer } from "@/components/projects/create-project-drawer";
import { CreateTile } from "@/components/workspace/create-tile";

/**
 * The client leaf on a workspace detail page. Opens the SAME drawer the
 * projects toolbar does — two create paths that disagree about which fields a
 * project has is how one of them silently stops sending a status.
 */
export function NewProjectCard({
  scope,
}: {
  scope: ProjectScope;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CreateTile
        label="New Project"
        description="Group related boards and tasks together."
        onClick={() => setOpen(true)}
      />
      <CreateProjectDrawer
        scope={scope}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
