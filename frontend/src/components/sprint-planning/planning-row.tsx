"use client";

import { ROW } from "@/components/sprint-planning/planning-tone";
import { StoryPointsBadge } from "@/components/backlog/story-points-badge";
import { TaskAssignee } from "@/components/backlog/task-assignee";
import { ProjectPriorityBadge } from "@/components/projects/project-priority-badge";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/table-icons";
import type { BacklogTask } from "@/types/backlog";

/*
 * One task, on whichever side it currently sits. The same row shape both times
 * — a task does not become a different object by crossing the gap, and two row
 * components would be two places to change the day it gains a field.
 *
 * The title is TEXT, not a button. Editing lives on the backlog screen; the one
 * thing this row does is move, so the row has exactly one control and the
 * keyboard never has to tab past a decoy to reach it.
 *
 * Labels are deliberately left off. The row is half the width it has on the
 * backlog screen, and priority plus estimate are what a planning decision is
 * actually made on.
 */
export function PlanningRow({
  task,
  action,
  onAction,
}: {
  task: BacklogTask;
  /** Which way this row moves: into the sprint, or back to the backlog. */
  action: "ADD" | "REMOVE";
  onAction: () => void;
}) {
  const adding = action === "ADD";

  return (
    <li className={ROW}>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="shrink-0 text-2xs font-semibold tabular-nums text-text-subtle">
            {task.id}
          </span>
          <span className="min-w-0 flex-1 text-sm font-medium text-text">
            {task.title}
          </span>
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ProjectPriorityBadge priority={task.priority} />
          <StoryPointsBadge points={task.storyPoints} />
          <TaskAssignee assignee={task.assignee} />
        </div>
      </div>

      {/* The id carries the accessible name, because "Add" repeated eleven
          times is a list of identical controls to anyone reading them out of
          context. The visible label stays short. */}
      <Button
        size="sm"
        variant={adding ? "outline" : "ghost"}
        onClick={onAction}
        aria-label={
          adding
            ? `Add ${task.id} to the sprint`
            : `Return ${task.id} to the backlog`
        }
      >
        {adding ? (
          <>
            Add
            <ChevronRightIcon className="size-3.5" />
          </>
        ) : (
          <>
            <ChevronLeftIcon className="size-3.5" />
            Remove
          </>
        )}
      </Button>
    </li>
  );
}
