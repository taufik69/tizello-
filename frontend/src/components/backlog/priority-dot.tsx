import { PRIORITY_DOT } from "@/components/backlog/backlog-tone";
import { cn } from "@/lib/cn";
import type { ProjectPriority } from "@/types/project";

/**
 * The disc beside a group heading. Decorative: the priority word always sits
 * next to it, so it is never the sole carrier of the meaning — which is what
 * lets it be judged at 3:1 rather than 4.5:1.
 *
 * Every caller places it on `bg-surface`; the group headers are untinted for
 * exactly that reason.
 */
export function PriorityDot({ priority }: { priority: ProjectPriority }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full", PRIORITY_DOT[priority])}
    />
  );
}
