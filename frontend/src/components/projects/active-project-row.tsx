import { DateRange } from "@/components/projects/date-range";
import { PersonCell } from "@/components/projects/person-cell";
import { ProjectNameCell } from "@/components/projects/project-name-cell";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import type { ProjectRecord } from "@/types/project";

/** One project, as eight cells of the grouped Active table. */
export function ActiveProjectRow({
  project,
  currentUserId,
}: {
  project: ProjectRecord;
  currentUserId: string;
}) {
  return (
    <TableRow className="hover:bg-surface-hover">
      <TableCell className="px-2 py-2 font-mono text-2xs whitespace-nowrap text-text-subtle">
        {project.id}
      </TableCell>
      <TableCell>
        <ProjectNameCell project={project} />
      </TableCell>
      <TableCell>
        <ProjectStatusBadge status={project.status} />
      </TableCell>
      <TableCell>
        <PersonCell
          person={project.owner}
          isCurrentUser={project.owner.id === currentUserId}
        />
      </TableCell>
      <TableCell>
        <DateRange project={project} />
      </TableCell>
      <TableCell>
        <ProjectPriorityBadge priority={project.priority} />
      </TableCell>
      <TableCell>
        <PersonCell
          person={project.createdBy}
          isCurrentUser={project.createdBy.id === currentUserId}
        />
      </TableCell>
      <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-text-subtle">
        {formatDate(project.createdTime)}
      </TableCell>
    </TableRow>
  );
}
