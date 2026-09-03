import { PROGRESS_FILL } from "@/components/sprints/sprint-tone";
import { cn } from "@/lib/cn";
import { donePercent } from "@/lib/sprint-groups";
import type { SprintState } from "@/types/sprint";
import type { BoardTotals } from "@/types/sprint-board";

/*
 * How much of the sprint is done, in the two currencies a standup asks for:
 * cards and points. Both are LIVE — they are counted from the cards on the
 * board, not read from the sprint's stored roll-ups, so dragging a card into
 * Done moves them immediately.
 *
 * The bar is `aria-hidden`: its width says exactly what the numbers beside it
 * already say in words, and announcing it twice is noise. Same call
 * `SprintProgress` makes on the sprints card, whose rail this matches.
 *
 * `width` is `style` because it is a computed percentage — the one dynamic
 * value the house rules allow.
 */
export function BoardProgress({
  totals,
  state,
}: {
  totals: BoardTotals;
  state: SprintState;
}) {
  const percent = donePercent({
    itemCount: totals.total,
    doneCount: totals.done,
  });

  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="text-2xs tabular-nums text-text-muted">
        <span className="font-semibold text-text">
          {totals.done} of {totals.total}
        </span>{" "}
        done
        <span aria-hidden="true"> &middot; {totals.donePoints} / {totals.totalPoints} pts</span>
        <span className="sr-only">
          , {totals.donePoints} of {totals.totalPoints} story points
        </span>
      </p>

      <span
        aria-hidden="true"
        className="h-1.5 w-16 shrink-0 overflow-hidden rounded-xs bg-surface-sunken"
      >
        <span
          style={{ width: `${percent}%` }}
          className={cn(
            "block h-full rounded-xs transition-[width] duration-100 ease-standard",
            PROGRESS_FILL[state],
          )}
        />
      </span>

      <span className="text-2xs font-semibold tabular-nums text-text-subtle">
        {percent}%
      </span>
    </div>
  );
}
