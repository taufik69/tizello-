import { PRIORITY_CHIP } from "@/components/projects/project-tone";
import { BADGE_BASE } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { PRIORITY_LABEL } from "@/lib/project-groups";
import type { ProjectPriority } from "@/types/project";

export function ProjectPriorityBadge({
  priority,
}: {
  priority: ProjectPriority;
}) {
  return (
    <span className={cn(BADGE_BASE, PRIORITY_CHIP[priority])}>
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
