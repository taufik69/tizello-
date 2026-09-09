import type { ProjectScope } from "@/components/projects/project-properties";
import { ProjectBoard } from "@/components/projects/project-board";
import type { ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/*
 * Kanban by status. **Drag and drop works** — dragging a card from On hold to
 * Active is a `PATCH /projects/:id` with the new status, optimistic on the
 * board and reverted with a toast if the API refuses.
 *
 * A column per status in `PROJECT_STATUSES` order, INCLUDING the empty ones.
 * Rendering only the statuses that happen to be occupied would silently drop
 * every Cancelled project off the screen — and an empty column is exactly the
 * one a card most needs to be dragged INTO, so a board that hides them is a
 * board you cannot use.
 *
 * A thin Server Component over `ProjectBoard`, which is where the client
 * boundary starts: the drag engine needs sensors, droppables and draggables,
 * so there is no leaf small enough to mark on its own.
 */
export function BoardView({
  projects,
  scope,
  workspaceRole,
}: {
  projects: ProjectRecord[];
  scope: ProjectScope;
  /** With each project's own `viewerRole`, decides which cards can be dragged. */
  workspaceRole: WorkspaceRole;
}) {
  return (
    <ProjectBoard
      projects={projects}
      scope={scope}
      workspaceRole={workspaceRole}
    />
  );
}
