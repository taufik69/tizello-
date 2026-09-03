import { AllProjectRow } from "@/components/projects/all-project-row";
import { AllSummaryRow } from "@/components/projects/all-summary-row";
import { ProjectsEmpty } from "@/components/projects/projects-empty";
import type { IconProps } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarIcon,
  DocIcon,
  FlagIcon,
  PersonIcon,
  TagIcon,
} from "@/components/ui/table-icons";
import { completeCount } from "@/lib/project-groups";
import type { ProjectRecord } from "@/types/project";

/* Six columns, ungrouped. The All view deliberately drops the ID and the
   creation metadata the Active view carries — that is most of what makes it
   narrow enough to fit a laptop without scrolling sideways. */
const COLUMNS: ReadonlyArray<{
  key: string;
  label: string;
  Glyph: (props: IconProps) => React.ReactElement;
}> = [
  { key: "name", label: "Project name", Glyph: DocIcon },
  { key: "status", label: "Status", Glyph: TagIcon },
  { key: "owner", label: "Owner", Glyph: PersonIcon },
  { key: "collaborators", label: "Collaborators", Glyph: PersonIcon },
  { key: "dates", label: "Dates", Glyph: CalendarIcon },
  { key: "priority", label: "Priority", Glyph: FlagIcon },
];

export function AllView({
  projects,
  currentUserId,
}: {
  projects: ProjectRecord[];
  currentUserId: string;
}) {
  if (projects.length === 0) return <ProjectsEmpty />;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {COLUMNS.map(({ key, label, Glyph }) => (
            <TableHead key={key}>
              <span className="flex items-center gap-1.5">
                <Glyph className="size-3.5 shrink-0" />
                {label}
              </span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {projects.map((project) => (
          <AllProjectRow
            key={project.id}
            project={project}
            currentUserId={currentUserId}
          />
        ))}
      </TableBody>

      <tfoot>
        <TableRow className="border-b-0">
          <TableCell colSpan={COLUMNS.length} className="p-0">
            <AllSummaryRow
              complete={completeCount(projects)}
              total={projects.length}
            />
          </TableCell>
        </TableRow>
      </tfoot>
    </Table>
  );
}
