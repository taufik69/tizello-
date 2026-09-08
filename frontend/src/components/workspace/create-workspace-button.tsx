"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace-dialog";

/**
 * The header's create control, for the views that have no create tile in the
 * body — the list, and the archived filter. Same dialog as
 * `CreateWorkspaceCard`; only the affordance differs, so the two cannot get out
 * of step on what creating a workspace asks for.
 */
export function CreateWorkspaceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <PlusIcon className="size-3.5" />
        New workspace
      </Button>
      <CreateWorkspaceDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
