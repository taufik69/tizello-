import type { ProjectScope } from "@/components/projects/project-properties";
import { CollaboratorStack } from "@/components/projects/collaborator-stack";
import { DateRange } from "@/components/projects/date-range";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectOwnerCell } from "@/components/projects/project-owner-cell";
import { ProjectNameCell } from "@/components/projects/project-name-cell";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/** One project, as seven cells of the flat All table. */
export function AllProjectRow({
  project,
  currentUserId,
  workspaceRole,
  scope,
}: {
  project: ProjectRecord;
  currentUserId: string;
  workspaceRole: WorkspaceRole;
  scope: ProjectScope;
}) {
  return (
    <TableRow className="hover:bg-surface-hover">
      <TableCell className="relative">
        <ProjectNameCell project={project} />
      </TableCell>
      <TableCell>
        <ProjectStatusBadge status={project.status} />
      </TableCell>
      <TableCell>
        <ProjectOwnerCell
          ownerId={project.ownerId}
          owner={project.owner}
          currentUserId={currentUserId}
        />
      </TableCell>
      <TableCell>
        <CollaboratorStack collaborators={project.collaborators ?? []} />
      </TableCell>
      <TableCell>
        <DateRange project={project} />
      </TableCell>
      <TableCell>
        <ProjectPriorityBadge priority={project.priority} />
      </TableCell>
      <TableCell className="w-9 text-right">
        <ProjectActionsMenu
          project={project}
          workspaceRole={workspaceRole}
          scope={scope}
          showOpenLink
        />
      </TableCell>
    </TableRow>
  );
}
