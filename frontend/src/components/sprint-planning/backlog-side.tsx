"use client";

import { PlanningEmpty } from "@/components/sprint-planning/planning-empty";
import { PlanningFilters } from "@/components/sprint-planning/planning-filters";
import { PlanningRow } from "@/components/sprint-planning/planning-row";
import { LIST, PANEL, PANEL_HEADER } from "@/components/sprint-planning/planning-tone";
import { totalPoints } from "@/lib/backlog-groups";
import { plural } from "@/lib/plural";
import { filterTasks, type PlanningFilters as Filters } from "@/lib/sprint-planning";
import type { BacklogTask } from "@/types/backlog";

/*
 * The left-hand panel: everything not committed to a sprint, and one control
 * per row to commit it.
 *
 * The panel owns the filtering rather than the parent, so the count in the
 * heading and the rows underneath are read from the same array and cannot
 * disagree. The parent keeps the filter VALUES, because they survive a task
 * moving out and back.
 */
export function BacklogSide({
  tasks,
  filters,
  onFiltersChange,
  onAdd,
}: {
  /** Every task with `sprintId: null`, unfiltered. */
  tasks: BacklogTask[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onAdd: (taskId: string) => void;
}) {
  const shown = filterTasks(tasks, filters);
  const filtered = shown.length !== tasks.length;

  return (
    <section className={PANEL} aria-labelledby="planning-backlog-heading">
      <div className={PANEL_HEADER}>
        <h2
          id="planning-backlog-heading"
          className="text-sm font-semibold text-text"
        >
          Backlog
        </h2>
        <p className="text-2xs tabular-nums text-text-subtle">
          {filtered ? (
            <>
              {shown.length} of {tasks.length} shown
            </>
          ) : (
            <>
              <span className="font-semibold text-text-muted">
                {plural(tasks.length, "item", "items")}
              </span>
              {totalPoints(tasks) > 0 && <> &middot; {totalPoints(tasks)} pts</>}
            </>
          )}
        </p>
      </div>

      <PlanningFilters filters={filters} onChange={onFiltersChange} />

      {tasks.length === 0 ? (
        <PlanningEmpty
          title="The backlog is empty"
          hint="Everything filed for this project is already committed to a sprint. New work starts on the backlog screen."
        />
      ) : shown.length === 0 ? (
        <PlanningEmpty
          title="No task matches those filters"
          hint="Clear the search, or widen the priority filter to see the rest of the backlog."
        />
      ) : (
        <ul className={LIST}>
          {shown.map((task) => (
            <PlanningRow
              key={task.id}
              task={task}
              action="ADD"
              onAction={() => onAdd(task.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
