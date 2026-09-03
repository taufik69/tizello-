import { DocIcon } from "@/components/ui/table-icons";
import type { ProjectRecord } from "@/types/project";

/*
 * The name, with the small page glyph Notion puts in front of a database row.
 *
 * There is no project detail route yet, so this is text and not a link — a
 * cell that lifts under the cursor promises a click that does not exist.
 *
 * `max-w-*` plus `truncate` rather than wrapping: TIZ-3's name is 52
 * characters and, left alone, would push the six columns after it off the
 * screen instead of scrolling with them.
 */
export function ProjectNameCell({ project }: { project: ProjectRecord }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <DocIcon className="size-3.5 shrink-0 text-text-subtle" />
      <span className="min-w-0 max-w-56 truncate font-medium text-text">
        {project.name}
      </span>
    </span>
  );
}
