"use client";

import { BacklogRowMenu } from "@/components/backlog/backlog-row-menu";
import { StoryPointsBadge } from "@/components/backlog/story-points-badge";
import { TaskAssignee } from "@/components/backlog/task-assignee";
import { TaskLabels } from "@/components/backlog/task-labels";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import { GripIcon } from "@/components/ui/icons";
import type { BacklogTask } from "@/types/backlog";

/*
 * One task. Flat and bordered, per DESIGN-SYSTEM.md — a list of rows, not a
 * stack of floating cards. Elevation is reserved for the menu that overlays
 * them.
 *
 * The layout is one column of content plus a fixed right rail: id and title on
 * the first line, chips on the second. At 360px the chips wrap onto as many
 * lines as they need and the rail never moves, so nothing overflows.
 *
 * The GRIP IS DECORATION. Reordering is not built, and a handle that looks
 * draggable and is not is worse than no handle — so it is `aria-hidden`, has no
 * `cursor-grab`, and is not in the tab order. Same call `StatusGroupHeader`
 * makes about its chevron.
 */
const ROW =
  "group relative flex items-start gap-2 rounded-md border border-border bg-surface p-2 transition-colors duration-100 ease-standard hover:bg-surface-hover";

/* The quick actions are revealed by hover on a pointer, but they are ALWAYS
   present below `sm`, where there is no hover to reveal them with. Focus
   inside the row shows them too, so the keyboard never chases an invisible
   control. */
const ACTIONS =
  "shrink-0 opacity-100 transition-opacity duration-100 ease-standard sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";

export function BacklogRow({
  task,
  onEdit,
  onDelete,
}: {
  task: BacklogTask;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={ROW}>
      <GripIcon
        className="mt-1 hidden size-4 shrink-0 text-text-subtle sm:block"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-2xs font-semibold tabular-nums text-text-subtle">
            {task.id}
          </span>
          {/* The title opens the editor: a row you can click is the fastest
              path to editing, and a real <button> keeps it keyboard-reachable
              with the base layer's focus ring. */}
          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 flex-1 rounded-xs text-left text-sm font-medium text-text"
          >
            {task.title}
          </button>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ProjectPriorityBadge priority={task.priority} />
          <StoryPointsBadge points={task.storyPoints} />
          <TaskLabels labels={task.labels} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <TaskAssignee assignee={task.assignee} />
        <span className={ACTIONS}>
          <BacklogRowMenu
            taskId={task.id}
            title={task.title}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </span>
      </div>
    </div>
  );
}
