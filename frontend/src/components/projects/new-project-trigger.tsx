import { PlusIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { cn } from "@/lib/cn";

/*
 * The `+ New project` affordance that closes every group and every board
 * column.
 *
 * `LockedControl` rather than a `<button>` with no handler: creating a project
 * is not built, and inertness is the contract here rather than something the
 * next caller has to remember not to break. The reason travels as a tooltip,
 * as the tail of the accessible name, and as the dim.
 *
 * `label` names the group it sits in, so five of these on one screen are five
 * distinct accessible names rather than five "New project"s.
 */
const BASE =
  "w-full justify-start gap-1.5 rounded-sm px-2 py-1.5 text-xs font-medium text-text-subtle";

export function NewProjectTrigger({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <LockedControl
      reason="Creating a project is not built yet"
      label={label}
      className={cn(BASE, className)}
    >
      <PlusIcon className="size-3.5" />
      New project
    </LockedControl>
  );
}
