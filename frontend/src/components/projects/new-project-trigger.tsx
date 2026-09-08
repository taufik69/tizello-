"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/ui/icons";
import { CreateProjectDrawer } from "@/components/projects/create-project-drawer";
import type { ProjectScope } from "@/components/projects/project-properties";
import { cn } from "@/lib/cn";
import type { ProjectStatus } from "@/types/project";

/*
 * The `+ New project` affordance that closes every group and every board
 * column.
 *
 * It works now — it opens the same drawer the toolbar's New button does, and
 * `status` is what makes the difference: adding from the "On hold" column
 * should produce an ON_HOLD project, not a PLANNING one somebody then has to
 * drag. That is the whole reason this is a separate trigger rather than five
 * copies of the toolbar button.
 *
 * `label` names the group it sits in, so five of these on one screen are five
 * distinct accessible names rather than five "New project"s.
 */
const BASE =
  "flex w-full items-center justify-start gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text";

export function NewProjectTrigger({
  label,
  scope,
  status,
  className,
}: {
  label: string;
  scope: ProjectScope;
  /** Seeds the drawer's Status, so a project added to a column lands in it. */
  status?: ProjectStatus;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className={cn(BASE, className)}
      >
        <PlusIcon className="size-3.5" />
        New project
      </button>

      <CreateProjectDrawer
        scope={scope}
        initialStatus={status}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
