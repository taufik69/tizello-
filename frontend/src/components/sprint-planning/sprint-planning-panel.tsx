"use client";

import { useState } from "react";
import { BacklogSide } from "@/components/sprint-planning/backlog-side";
import { PlanningBar } from "@/components/sprint-planning/planning-bar";
import { PlanningEmpty } from "@/components/sprint-planning/planning-empty";
import { SprintSide } from "@/components/sprint-planning/sprint-side";
import { StartSprintDialog } from "@/components/sprint-planning/start-sprint-dialog";
import { totalPoints } from "@/lib/backlog-groups";
import { activeSprint } from "@/lib/sprint-groups";
import { startSprint } from "@/lib/sprint-edit";
import {
  NO_FILTERS,
  backlogTasks,
  planIntoSprint,
  planningSprints,
  returnToBacklog,
  sprintTasks,
  type PlanningFilters,
} from "@/lib/sprint-planning";
import type { BacklogTask } from "@/types/backlog";
import type { SprintRecord } from "@/types/sprint";

/*
 * The interactive half of sprint planning. The page above stays a Server
 * Component and hands both containers down as one list; this leaf owns what a
 * static tree cannot: which sprint is being filled, where each task currently
 * sits, and the filters on the backlog side.
 *
 * NOTHING PERSISTS. There is no API and no Server Action behind any of this —
 * every move lives in `useState` and is gone on refresh. `lib/sprint-planning.ts`
 * is already shaped like the payload `planIntoSprintAction` takes, so wiring it
 * later is a body swap rather than a rewrite.
 *
 * ONE LIST, TWO PANELS. `sprintId` decides which side a task is on, so a task
 * cannot be in both and no row has to be copied — the move is the state change.
 */
export function SprintPlanningPanel({
  tasks: initialTasks,
  sprints: initialSprints,
  today,
}: {
  /** Every task in the project, planned or not. */
  tasks: BacklogTask[];
  sprints: SprintRecord[];
  /** The app's pinned today. See the note in `demo-projects.ts`. */
  today: string;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [sprints, setSprints] = useState(initialSprints);
  const options = planningSprints(sprints);
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");
  const [filters, setFilters] = useState<PlanningFilters>(NO_FILTERS);
  const [startPending, setStartPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  /* Still resolves after a start, when the sprint has left `options` but is
     very much still the one on screen. */
  const selected = sprints.find((sprint) => sprint.id === selectedId);

  if (!selected) {
    return (
      <PlanningEmpty
        title="No sprint to plan into"
        hint="Planning fills a sprint that has not started yet. Create one on the sprints screen, then come back."
      />
    );
  }

  const planned = sprintTasks(tasks, selected.id);
  const points = totalPoints(planned);
  const running = activeSprint(sprints);

  function move(taskId: string, into: boolean) {
    setTasks((current) =>
      into
        ? planIntoSprint(current, selectedId, [taskId])
        : returnToBacklog(current, [taskId]),
    );
    /* The row leaves the list it was in, so the button that was just pressed
       goes with it. The live region is what tells anyone not watching the
       screen that the move happened. */
    setAnnouncement(
      into
        ? `${taskId} added to ${selected?.name}.`
        : `${taskId} returned to the backlog.`,
    );
  }

  return (
    <section>
      <PlanningBar
        sprints={options}
        selected={selected}
        points={points}
        onSelect={(id) => {
          setSelectedId(id);
          setAnnouncement("");
        }}
        onStart={() => setStartPending(true)}
      />

      {/* Side by side once there is room for two readable columns; stacked
          below that, backlog first, which is the order the move happens in. */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
        <BacklogSide
          tasks={backlogTasks(tasks)}
          filters={filters}
          onFiltersChange={setFilters}
          onAdd={(taskId) => move(taskId, true)}
        />
        <SprintSide
          sprint={selected}
          tasks={planned}
          today={today}
          onRemove={(taskId) => move(taskId, false)}
        />
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <StartSprintDialog
        sprint={startPending ? selected : null}
        count={planned.length}
        points={points}
        blockedBy={running}
        onOpenChange={() => setStartPending(false)}
        onConfirm={() => {
          /* `startSprint` enforces the single-active rule itself, so this
             cannot produce two running sprints even if the dialog let it. */
          setSprints((current) => startSprint(current, selectedId));
          setStartPending(false);
        }}
      />
    </section>
  );
}
