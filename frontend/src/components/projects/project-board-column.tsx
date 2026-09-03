import { NewProjectTrigger } from "@/components/projects/new-project-trigger";
import { ProjectBoardCard } from "@/components/projects/project-board-card";
import { StatusDot } from "@/components/projects/status-dot";
import { plural } from "@/lib/plural";
import { STATUS_LABEL } from "@/lib/project-groups";
import type { ProjectRecord, ProjectStatus } from "@/types/project";

/*
 * One kanban column. `w-list` is Trello's 272px, the same width every other
 * column in this app uses.
 *
 * The header stays untinted — the coloured pill is the dot plus the label, and
 * the dot needs `bg-surface` under it to clear 3:1. Tinting the whole column
 * would also wash out five cards to colour one heading.
 */
export function ProjectBoardColumn({
  status,
  projects,
}: {
  status: ProjectStatus;
  projects: ProjectRecord[];
}) {
  const headingId = `board-column-${status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="flex w-list shrink-0 flex-col gap-2"
    >
      <h3 id={headingId} className="flex items-center gap-1.5 px-0.5">
        <StatusDot status={status} />
        <span className="text-xs font-semibold text-text">
          {STATUS_LABEL[status]}
        </span>
        <span className="text-2xs tabular-nums text-text-subtle">
          {projects.length}
        </span>
      </h3>

      {projects.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-surface-sunken px-3 py-6 text-center text-xs text-text-subtle">
          Nothing in {STATUS_LABEL[status]}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectBoardCard project={project} />
            </li>
          ))}
        </ul>
      )}

      <NewProjectTrigger
        label={`New project in ${STATUS_LABEL[status]}, which has ${plural(projects.length, "project", "projects")}`}
      />
    </section>
  );
}
