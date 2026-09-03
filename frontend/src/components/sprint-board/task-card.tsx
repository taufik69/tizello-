import { StoryPointsBadge } from "@/components/backlog/story-points-badge";
import { TaskAssignee } from "@/components/backlog/task-assignee";
import { TaskLabels } from "@/components/backlog/task-labels";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import type { SprintBoardTask } from "@/types/sprint-board";

/*
 * A card, and only the card: no border, no hover, no drag wiring. The sortable
 * item and the drag overlay both render this, which is what makes the ghost
 * under the pointer identical to the card it came from.
 *
 * Every chip is the one another screen already draws — the priority badge from
 * the projects table, the estimate, the tags and the assignee disc from the
 * backlog row. A card is the same task those screens list, so a second palette
 * for it would be a second statement about one thing.
 *
 * `pr-6` on the first row is the space the drag handle sits in. It is reserved
 * whether or not the handle is showing, so nothing shifts on hover and the
 * handle never lands on top of the id.
 */
export const TASK_CARD_SHELL =
  "rounded-md border border-border bg-surface transition-colors duration-100 ease-standard";

export function TaskCard({ task }: { task: SprintBoardTask }) {
  return (
    <div className="space-y-1.5 px-2.5 py-2">
      <p className="pr-6 text-2xs font-medium tracking-tight text-text-subtle">
        {task.id}
      </p>

      <p className="text-sm text-text">{task.title}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        <ProjectPriorityBadge priority={task.priority} />
        <TaskLabels labels={task.labels} />

        <span className="ml-auto flex shrink-0 items-center gap-1.5">
          <StoryPointsBadge points={task.storyPoints} />
          <TaskAssignee assignee={task.assignee} />
        </span>
      </div>
    </div>
  );
}
