"use client";

import type { ProjectScope } from "@/components/projects/project-properties";
import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { CreateProjectDrawer } from "@/components/projects/create-project-drawer";

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
  scope,
}: {
  scope: ProjectScope;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={NEW}>
        <PlusIcon className="size-3.5" />
        New
      </button>

      <CreateProjectDrawer
        workspaceId={scope.workspaceId}
        workspaceName={scope.workspaceName}
        today={scope.today}
        definitions={scope.definitions}
        canManageProperties={scope.canManageProperties}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
