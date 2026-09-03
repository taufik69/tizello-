import { CollaboratorStack } from "@/components/projects/collaborator-stack";
import { DateRange } from "@/components/projects/date-range";
import { PersonCell } from "@/components/projects/person-cell";
import { ProjectNameCell } from "@/components/projects/project-name-cell";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ProjectRecord } from "@/types/project";

/** One project, as six cells of the flat All table. */
export function AllProjectRow({
  project,
  currentUserId,
}: {
  project: ProjectRecord;
  currentUserId: string;
}) {
  return (
    <TableRow className="hover:bg-surface-hover">
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
        <CollaboratorStack collaborators={project.collaborators} />
      </TableCell>
      <TableCell>
        <DateRange project={project} />
      </TableCell>
      <TableCell>
        <ProjectPriorityBadge priority={project.priority} />
      </TableCell>
    </TableRow>
  );
}
