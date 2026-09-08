"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";

/**
 * The toolbar's New button. A client leaf so the projects page stays a Server
 * Component.
 *
 * Unlike the `LockedControl` it replaces, this one carries the real
 * `hover:`/`active:` feedback — it now does something, so lighting up under
 * the cursor is a promise it keeps.
 */
const NEW =
  "inline-flex h-7 shrink-0 items-center gap-1 rounded-sm bg-brand-500 pr-2 pl-1.5 text-xs font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400";

export function CreateProjectButton({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={NEW}>
        <PlusIcon className="size-3.5" />
        New
      </button>

      <CreateProjectDialog
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
