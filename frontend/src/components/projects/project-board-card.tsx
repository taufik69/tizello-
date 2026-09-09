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
 *
 * `draggable={false}` IS WHAT MAKES THE CARD DRAGGABLE, which reads backwards
 * and is the whole bug. An `<a href>` is a native drag source, and this one's
 * `::after` covers the entire card — so a press-and-move anywhere on it made
 * Chrome start its own link drag, and Chrome fires `pointercancel` at the
 * source the moment it commits to that. dnd-kit's activation controller was
 * cancelled before it ever reached its 8px threshold, so the card would not
 * lift. The one patch of card NOT covered by this pseudo-element is the grip
 * button (`z-10`), which is why the grip was the only place a drag started —
 * a symptom that looks like a handle bug and is not one.
 *
 * Turning the native behaviour off is the fix rather than intercepting
 * `dragstart`: dnd-kit already calls `preventDefault` there, and it does not
 * help, because `pointercancel` is dispatched first.
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
          draggable={false}
          className="min-w-0 break-words after:absolute after:inset-0 after:rounded-md"
        >
          {project.name}
        </Link>
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        <CollaboratorStack collaborators={project.collaborators ?? []} hideWhenEmpty />
      </div>
    </article>
  );
}
