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
 * `draggable={false}` outlived the library that needed it and is still right:
 * the board's own drag (`lib/board-drag.ts`) uses pointer events, and a native
 * link-drag competing for the same press would still cancel them.
 *
 * THE META ROW IS THREE OPTIONAL PARTS. A board card is 272px wide and the
 * useful thing about it differs by team — some want the key to quote in
 * standup, some want faces, some want neither and a wall of names. Each part
 * carries a `data-card-*` attribute and is hidden by a CSS rule keyed on the
 * gear's stored preference (`projects-prefs-scope.tsx`), so all three toggles
 * cost this component three attributes and no props. The row itself carries one
 * too, because with all three off it would be an empty 8px gap.
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

      <div data-card-meta className="mt-2 flex items-center gap-2">
        <span data-card-status-chip>
          <ProjectStatusBadge status={project.status} />
        </span>

        <span
          data-card-key-text
          className="font-mono text-2xs tracking-wide text-text-subtle"
        >
          {project.key}
        </span>

        {/* `ms-auto` rather than `justify-between` on the row: with the chip
            hidden, space-between would leave the faces stranded on the LEFT
            where every other card has them on the right. Pushing off the
            preceding content keeps them at the end whatever survives. */}
        <span data-card-people-stack className="ms-auto">
          <CollaboratorStack collaborators={project.collaborators ?? []} hideWhenEmpty />
        </span>
      </div>
    </article>
  );
}
