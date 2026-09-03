import { STATUS_DOT } from "@/components/projects/project-tone";
import { cn } from "@/lib/cn";
import type { ProjectStatus } from "@/types/project";

/**
 * The disc beside a group heading. Decorative: the status name always sits
 * next to it, so it is never the sole carrier of the meaning — which is what
 * lets it be judged at 3:1 rather than 4.5:1.
 *
 * Every caller places it on `bg-surface`. On `bg-surface-sunken` the green
 * drops to 2.59:1 in light, which is why the group headers are untinted.
 */
export function StatusDot({ status }: { status: ProjectStatus }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[status])}
    />
  );
}
