import { formatDate } from "@/lib/format-date";
import type { ProjectRecord } from "@/types/project";

/*
 * `10 Aug 2026 → 2 Oct 2026`, through `formatDate` so the locale and the time
 * zone are pinned and the server and the browser cannot render different text.
 *
 * A project with no dates is a real row, not a broken one: TIZ-6 has been
 * filed and never scheduled. It says so rather than rendering an empty cell.
 */
export function DateRange({ project }: { project: ProjectRecord }) {
  if (!project.startDate || !project.endDate) {
    return <span className="text-xs text-text-subtle italic">Not scheduled</span>;
  }

  return (
    <span className="text-xs whitespace-nowrap text-text-muted">
      {formatDate(project.startDate)}
      <span aria-hidden="true"> &rarr; </span>
      <span className="sr-only">to </span>
      {formatDate(project.endDate)}
    </span>
  );
}
