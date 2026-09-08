import Link from "next/link";
import { CollaboratorStack } from "@/components/projects/collaborator-stack";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ProjectGlyph } from "@/components/projects/project-glyph";
import type { ProjectRecord } from "@/types/project";

/*
 * Flat and bordered, per DESIGN-SYSTEM.md — twenty shadowed cards in a column
 * read as noise. Elevation is for things that overlay something else.
 *
 * The name WRAPS here rather than truncating: a board card is the one place
 * with vertical room, and a column is unreadable if every card says
 * "Motion planning SDK v3 migra…".
 *
 * The name carries a stretched link over the whole card. There is no actions
 * menu here — a board card is 200px of vertical space and a `⋯` in every one
 * of twenty cards is noise; the card opens the project, where the menu is.
 */
export function ProjectBoardCard({ project }: { project: ProjectRecord }) {
  return (
    <article className="relative rounded-md border border-border bg-surface p-2.5">
      <p className="flex items-start gap-1.5 text-sm font-medium text-text">
        <ProjectGlyph
          icon={project.icon}
          color={project.color}
          size="sm"
          className="mt-0.5"
        />
        <Link
          href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
          className="min-w-0 break-words after:absolute after:inset-0 after:rounded-md"
        >
          {project.name}
        </Link>
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        <CollaboratorStack collaborators={project.collaborators ?? []} />
      </div>
    </article>
  );
}
