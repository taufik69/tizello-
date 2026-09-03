import { CollaboratorStack } from "@/components/projects/collaborator-stack";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { DocIcon } from "@/components/ui/table-icons";
import type { ProjectRecord } from "@/types/project";

/*
 * Flat and bordered, per DESIGN-SYSTEM.md — twenty shadowed cards in a column
 * read as noise. Elevation is for things that overlay something else.
 *
 * The name WRAPS here rather than truncating: a board card is the one place
 * with vertical room, and a column is unreadable if every card says
 * "Motion planning SDK v3 migra…".
 */
export function ProjectBoardCard({ project }: { project: ProjectRecord }) {
  return (
    <article className="rounded-md border border-border bg-surface p-2.5">
      <p className="flex items-start gap-1.5 text-sm font-medium text-text">
        <DocIcon className="mt-0.5 size-3.5 shrink-0 text-text-subtle" />
        <span className="min-w-0 break-words">{project.name}</span>
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        <CollaboratorStack collaborators={project.collaborators} />
      </div>
    </article>
  );
}
