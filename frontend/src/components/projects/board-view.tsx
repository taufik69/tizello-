import { ProjectBoardColumn } from "@/components/projects/project-board-column";
import { groupByStatus } from "@/lib/project-groups";
import type { ProjectRecord } from "@/types/project";

/*
 * Kanban by status. Visual only — drag and drop is not built this round, so
 * nothing here claims to be draggable.
 *
 * A column per status in `PROJECT_STATUSES` order, INCLUDING the empty ones.
 * Rendering only the four statuses that happen to be occupied would silently
 * drop every Complete and To-do project off the screen, and a board that hides
 * rows is a bug rather than a filter. To-do is the empty column in the current
 * fixture, which is what exercises the empty state.
 *
 * The rail scrolls horizontally with `scrollbar-board`, the same treatment the
 * sprint board's list track uses.
 */
export function BoardView({ projects }: { projects: ProjectRecord[] }) {
  const groups = groupByStatus(projects);

  return (
    <div className="scrollbar-board -mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      <div className="flex items-start gap-4">
        {groups.map((group) => (
          <ProjectBoardColumn
            key={group.status}
            status={group.status}
            projects={group.projects}
          />
        ))}
      </div>
    </div>
  );
}
