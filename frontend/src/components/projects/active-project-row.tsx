import { DateRange } from "@/components/projects/date-range";
import { ProjectActionsMenu } from "@/components/projects/project-actions-menu";
import { ProjectOwnerCell } from "@/components/projects/project-owner-cell";
import { ProjectNameCell } from "@/components/projects/project-name-cell";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import type { ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * One project, as eight cells of the grouped Active table.
 *
 * The whole row is NOT one link — there is a menu in the last cell, and a
 * `<button>` inside an `<a>` is invalid HTML. The name is the link instead,
 * with a stretched hit area over its own cell (see `ProjectNameCell`).
 */
export function ActiveProjectRow({
  project,
  currentUserId,
  workspaceRole,
}: {
  project: ProjectRecord;
  currentUserId: string;
  workspaceRole: WorkspaceRole;
}) {
  return (
    <TableRow className="hover:bg-surface-hover">
      <TableCell className="px-2 py-2 font-mono text-2xs whitespace-nowrap text-text-subtle">
        {project.key}
      </TableCell>
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
        <DateRange project={project} />
      </TableCell>
      <TableCell>
        <ProjectPriorityBadge priority={project.priority} />
      </TableCell>
      {/* No "Created by" column: the API records `ownerId` and no creator, and
          on every project that has never changed hands they are the same
          person. A column that duplicates Owner on almost every row and is
          blank on the rest is worse than one fewer column. */}
      <TableCell className="px-2 py-2 text-xs whitespace-nowrap text-text-subtle">
        {formatDate(project.createdAt)}
      </TableCell>
      <TableCell className="w-9 text-right">
        <ProjectActionsMenu
          project={project}
          workspaceRole={workspaceRole}
          showOpenLink
        />
      </TableCell>
    </TableRow>
  );
}
