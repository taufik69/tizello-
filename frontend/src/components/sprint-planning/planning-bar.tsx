"use client";

import { CapacityMeter } from "@/components/sprint-planning/capacity-meter";
import { SprintSelect } from "@/components/sprint-planning/sprint-select";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@/components/ui/icons";
import type { SprintRecord } from "@/types/sprint";

/*
 * The strip under the page header: which sprint on the left, how full it is and
 * the way to start it on the right.
 *
 * It wraps rather than scrolls. At 360px the selector takes the first line and
 * the meter and the button drop below it, which is why the button is not
 * pinned to the meter's baseline.
 *
 * "Start sprint" is live whenever the selected sprint is still in PLANNING —
 * the summary of what starting means belongs in the dialog, including the case
 * where another sprint is running and the transition will be refused. A control
 * that opens a dialog explaining why it cannot proceed is more use than a
 * dimmed one that explains nothing.
 */
export function PlanningBar({
  sprints,
  selected,
  points,
  onSelect,
  onStart,
}: {
  sprints: SprintRecord[];
  selected: SprintRecord;
  /** Story points across the tasks currently in the selected sprint. */
  points: number;
  onSelect: (sprintId: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border pb-3">
      {/* No state badge here: the sprint panel's own heading carries one, and
          the same chip twice on one screen is noise rather than emphasis. */}
      <SprintSelect sprints={sprints} selected={selected} onSelect={onSelect} />

      <div className="flex items-center gap-3">
        <CapacityMeter points={points} capacity={selected.capacityPoints} />

        {selected.state === "PLANNING" ? (
          <Button onClick={onStart}>
            <PlayIcon className="size-3.5" />
            Start sprint
          </Button>
        ) : (
          /* Started, in this session. Planning is over for this box, so the
             control that would start it again does not exist rather than
             sitting there disabled. */
          <p className="max-w-40 text-2xs text-text-muted">
            This sprint is running. Work it on the sprint board.
          </p>
        )}
      </div>
    </div>
  );
}
