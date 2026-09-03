import { STATUS_CHIP } from "@/components/projects/project-tone";
import { BADGE_BASE } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { STATUS_LABEL } from "@/lib/project-groups";
import type { ProjectStatus } from "@/types/project";

/**
 * The status chip. Text, not a colour alone — the fill is recognition, the
 * word is the meaning, and anyone who cannot separate the two hues still reads
 * the row correctly.
 */
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={cn(BADGE_BASE, STATUS_CHIP[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
