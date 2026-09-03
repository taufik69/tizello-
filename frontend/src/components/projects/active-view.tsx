import { ActiveProjectRow } from "@/components/projects/active-project-row";
import {
  ACTIVE_COLUMN_COUNT,
  ActiveTableHead,
} from "@/components/projects/active-table-head";
import { NewProjectTrigger } from "@/components/projects/new-project-trigger";
import { ProjectsEmpty } from "@/components/projects/projects-empty";
import { StatusGroupHeader } from "@/components/projects/status-group-header";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { groupByStatus, STATUS_LABEL } from "@/lib/project-groups";
import type { ProjectRecord } from "@/types/project";

/*
 * The default view: one table, grouped by status.
 *
 * ONE `<table>` with a `<tbody>` per group, not a table per group. Separate
 * tables size their columns independently, so eight columns would land at
 * eight different x-positions in each group and the thing would stop reading
 * as a table at all. A group heading is therefore a full-width `<th
 * scope="colgroup">`, which is also what tells a screen reader that the rows
 * below it belong to that status.
 *
 * Empty statuses are dropped here — a heading with no rows under it is noise
 * in a list, where on the board it is a column you could drop into.
 */
export function ActiveView({
  projects,
  currentUserId,
}: {
  projects: ProjectRecord[];
  currentUserId: string;
}) {
  const groups = groupByStatus(projects, { includeEmpty: false });
  if (groups.length === 0) return <ProjectsEmpty />;

  return (
    <Table>
      <ActiveTableHead />

      {groups.map((group) => (
        <TableBody key={group.status}>
          <TableRow className="bg-surface">
            <TableHead
              scope="colgroup"
              colSpan={ACTIVE_COLUMN_COUNT}
              className="px-2 pt-4 pb-1.5"
            >
              <StatusGroupHeader
                status={group.status}
                count={group.projects.length}
              />
            </TableHead>
          </TableRow>

          {group.projects.map((project) => (
            <ActiveProjectRow
              key={project.id}
              project={project}
              currentUserId={currentUserId}
            />
          ))}

          <TableRow className="border-b-0">
            <TableCell colSpan={ACTIVE_COLUMN_COUNT} className="px-1 py-1">
              {/* Capped: the trigger must not stretch to the full scroll
                  width of an eight-column table. */}
              <span className="block max-w-64">
                <NewProjectTrigger
                  label={`New project in ${STATUS_LABEL[group.status]}`}
                />
              </span>
            </TableCell>
          </TableRow>
        </TableBody>
      ))}
    </Table>
  );
}
