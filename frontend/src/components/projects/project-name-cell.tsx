import Link from "next/link";
import { ProjectGlyph } from "@/components/projects/project-glyph";
import type { ProjectRecord } from "@/types/project";

/*
 * The name, with the project's own glyph in front of it — its emoji on its
 * colour, or the neutral page mark Notion puts in front of a database row when
 * neither is set. See `project-glyph.tsx`.
 *
 * The name is the link, not the row: there is a menu in the row's last cell,
 * and a `<button>` inside an `<a>` is invalid HTML. `after:absolute
 * after:inset-0` stretches the hit area over its own CELL, which is why the
 * caller puts `relative` on the `<td>` and never on the `<tr>` — a table row
 * is not a dependable containing block, and an overlay that escapes one
 * resolves against the viewport, giving an invisible link across the page.
 *
 * `max-w-*` plus `truncate` rather than wrapping: a 52-character project name,
 * left alone, would push the columns after it off the screen instead of
 * scrolling with them.
 *
 * `data-project-name` IS THE OPT-OUT HANDLE. Truncating is the default and is
 * the right default, but it hides information — a name that differs from
 * another only past the ellipsis is unreadable — so the gear offers wrapping,
 * and `globals.css` undoes the cap and the clip through this attribute rather
 * than through a prop threaded down to every table row. See
 * `projects-prefs-scope.tsx`.
 */
export function ProjectNameCell({ project }: { project: ProjectRecord }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <ProjectGlyph icon={project.icon} color={project.color} size="sm" />
      <Link
        data-project-name
        href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
        className="min-w-0 max-w-56 truncate font-medium text-text after:absolute after:inset-0"
      >
        {project.name}
      </Link>
    </span>
  );
}
