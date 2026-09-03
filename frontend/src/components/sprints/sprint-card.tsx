"use client";

import { SprintCardMenu } from "@/components/sprints/sprint-card-menu";
import { SprintCounts } from "@/components/sprints/sprint-counts";
import { SprintProgress } from "@/components/sprints/sprint-progress";
import { SprintStateBadge } from "@/components/sprints/sprint-state-badge";
import { SprintWindow } from "@/components/sprints/sprint-window";
import { CARD_BORDER } from "@/components/sprints/sprint-tone";
import { cn } from "@/lib/cn";
import type { SprintRecord } from "@/types/sprint";

/*
 * One sprint. Flat and bordered, per DESIGN-SYSTEM.md — a list of cards, not a
 * stack of floating ones. Elevation is reserved for the menu that overlays
 * them, and the ACTIVE card is picked out by a tinted BORDER rather than a
 * tinted fill: the progress bar's `info` and `success` are judged against
 * `surface`, and washing the card would drop them below the 3:1 an indicator
 * needs.
 *
 * For the same reason the card has no hover fill, unlike a backlog row. A row
 * is one clickable thing; this is a container holding a title button and a
 * menu, and lighting the whole surface would move the bar's background under
 * the pointer for no gain.
 *
 * The layout is one content column plus a fixed right rail. At 360px the name
 * wraps to as many lines as it needs and the badge and kebab never move, so
 * nothing overflows.
 */
const CARD = "rounded-md border bg-surface p-3";

export function SprintCard({
  sprint,
  today,
  startBlocked,
  onEdit,
  onStart,
  onComplete,
  onDelete,
}: {
  sprint: SprintRecord;
  today: string;
  /** Another sprint is already running, so this one cannot start. */
  startBlocked: boolean;
  onEdit: () => void;
  onStart: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <article className={cn(CARD, CARD_BORDER[sprint.state])}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="shrink-0 text-2xs font-semibold tabular-nums text-text-subtle">
              {sprint.id}
            </span>
            {/* The name opens the editor: a real <button>, so it is
                keyboard-reachable and carries the base layer's focus ring. */}
            <h3 className="min-w-0 flex-1">
              <button
                type="button"
                onClick={onEdit}
                className="w-full rounded-xs text-left text-sm font-semibold text-text transition-colors duration-100 ease-standard hover:text-text-brand"
              >
                {sprint.name}
              </button>
            </h3>
          </div>

          <div className="mt-1">
            <SprintWindow sprint={sprint} today={today} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <SprintStateBadge state={sprint.state} />
          <SprintCardMenu
            sprint={sprint}
            startBlocked={startBlocked}
            onEdit={onEdit}
            onStart={onStart}
            onComplete={onComplete}
            onDelete={onDelete}
          />
        </div>
      </div>

      {sprint.goal && (
        <p className="mt-2 max-w-prose text-xs text-text-muted">
          <span className="font-semibold text-text">Goal: </span>
          {sprint.goal}
        </p>
      )}

      <div className="mt-2.5">
        <SprintCounts sprint={sprint} />
      </div>

      {/* Progress is only honest once work has been committed. A PLANNING
          sprint has nothing done by definition, so a 0% bar there would be a
          statement about nothing. */}
      {sprint.state !== "PLANNING" && <SprintProgress sprint={sprint} />}
    </article>
  );
}
