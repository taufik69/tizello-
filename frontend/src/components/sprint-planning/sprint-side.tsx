"use client";

import { PlanningEmpty } from "@/components/sprint-planning/planning-empty";
import { PlanningRow } from "@/components/sprint-planning/planning-row";
import { LIST, PANEL, PANEL_HEADER } from "@/components/sprint-planning/planning-tone";
import { SprintStateBadge } from "@/components/sprints/sprint-state-badge";
import { SprintWindow } from "@/components/sprints/sprint-window";
import { plural } from "@/lib/plural";
import { totalPoints } from "@/lib/backlog-groups";
import type { BacklogTask } from "@/types/backlog";
import type { SprintRecord } from "@/types/sprint";

/*
 * The right-hand panel: what is in the sprint so far, and one control per row
 * to send it back.
 *
 * `SprintWindow` and `SprintStateBadge` are the sprints screen's own parts,
 * imported rather than re-drawn — the same sprint has to read the same way in
 * both places, and a second date line would be a second thing to keep in sync.
 *
 * The running total is computed from the ROWS, never from `sprint.totalPoints`.
 * That roll-up is the stored one, and the whole point of this screen is that it
 * is about to change; reading it here would show a number one move out of date.
 */
export function SprintSide({
  sprint,
  tasks,
  today,
  onRemove,
}: {
  sprint: SprintRecord;
  /** Tasks whose `sprintId` is this sprint's, in the order they were pulled in. */
  tasks: BacklogTask[];
  /** The app's pinned today, threaded down from the page. */
  today: string;
  onRemove: (taskId: string) => void;
}) {
  const points = totalPoints(tasks);

  return (
    <section className={PANEL} aria-labelledby="planning-sprint-heading">
      <div className={PANEL_HEADER}>
        <div className="min-w-0">
          <h2
            id="planning-sprint-heading"
            className="text-sm font-semibold text-text"
          >
            {sprint.name}
          </h2>
          <div className="mt-0.5">
            <SprintWindow sprint={sprint} today={today} />
          </div>
        </div>
        <SprintStateBadge state={sprint.state} />
      </div>

      <p className="mt-2 text-2xs tabular-nums text-text-subtle">
        <span className="font-semibold text-text-muted">
          {plural(tasks.length, "item", "items")}
        </span>
        {points > 0 && (
          <>
            {" "}
            &middot; <span aria-hidden="true">{points} pts</span>
            <span className="sr-only">{points} story points planned</span>
          </>
        )}
      </p>

      {tasks.length === 0 ? (
        <PlanningEmpty
          title="Nothing planned into this sprint yet"
          hint="Add tasks from the backlog to fill it. The points add up as you go, against the sprint's capacity."
        />
      ) : (
        <ul className={LIST}>
          {tasks.map((task) => (
            <PlanningRow
              key={task.id}
              task={task}
              action="REMOVE"
              onAction={() => onRemove(task.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
