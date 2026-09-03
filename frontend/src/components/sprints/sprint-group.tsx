"use client";

import { SprintCard } from "@/components/sprints/sprint-card";
import { STATE_DOT } from "@/components/sprints/sprint-tone";
import { cn } from "@/lib/cn";
import { SPRINT_STATE_BLURB, SPRINT_STATE_LABEL } from "@/lib/sprint-groups";
import type { SprintRecord, SprintState } from "@/types/sprint";

/*
 * One state band: its heading and the cards under it.
 *
 * The heading is a real `<h2>` — the page's `<h1>` is "Sprints" and each card
 * carries an `<h3>`, so the three levels descend without a skip and the list is
 * skimmable by heading.
 *
 * Empty bands never reach here: `groupByState` drops them, because an "Active"
 * heading over nothing is only a second way of saying what the list already
 * shows. When every band is empty the panel renders `SprintsEmpty` instead.
 *
 * Cards are keyed on the sprint id, never the index: a delete anywhere but the
 * end would otherwise hand the wrong open menu to the wrong sprint.
 */
export function SprintGroup({
  state,
  sprints,
  today,
  active,
  onEdit,
  onStart,
  onComplete,
  onDelete,
}: {
  state: SprintState;
  sprints: SprintRecord[];
  today: string;
  /** The running sprint, if there is one. Blocks Start on every other card. */
  active?: SprintRecord;
  onEdit: (sprint: SprintRecord) => void;
  onStart: (sprint: SprintRecord) => void;
  onComplete: (sprint: SprintRecord) => void;
  onDelete: (sprint: SprintRecord) => void;
}) {
  return (
    <section className="mt-6 first:mt-4">
      <div className="flex items-center gap-1.5">
        {/* Decorative: the state word sits beside it, and every card repeats
            the state as a chip, so the dot is never the sole carrier. */}
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", STATE_DOT[state])}
        />
        <h2 className="text-xs font-semibold tracking-widest text-text uppercase">
          {SPRINT_STATE_LABEL[state]}
        </h2>
        <span className="text-2xs tabular-nums text-text-subtle">
          {sprints.length}
        </span>
      </div>

      <p className="mt-0.5 text-2xs text-text-subtle">
        {SPRINT_STATE_BLURB[state]}
      </p>

      <ul className="mt-2 space-y-2">
        {sprints.map((sprint) => (
          <li key={sprint.id}>
            <SprintCard
              sprint={sprint}
              today={today}
              startBlocked={Boolean(active && active.id !== sprint.id)}
              onEdit={() => onEdit(sprint)}
              onStart={() => onStart(sprint)}
              onComplete={() => onComplete(sprint)}
              onDelete={() => onDelete(sprint)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
