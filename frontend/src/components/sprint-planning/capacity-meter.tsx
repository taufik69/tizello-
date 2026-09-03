import { cn } from "@/lib/cn";
import { capacityPercent, isOverCapacity } from "@/lib/sprint-planning";

/*
 * `18 / 25 pts` — what is in the sprint against what the team expects to
 * finish. The number is the message; the rail underneath is the same number
 * seen at a glance, and it is `aria-hidden` for exactly that reason: announcing
 * a bar that encodes the text beside it only says everything twice. Same call
 * `SprintProgress` and `TimelineRow` make.
 *
 * Over capacity is a real state, not an error: teams over-commit on purpose and
 * then argue about it. It reads in `danger`, and the bar stops at the rail
 * rather than running past it — `capacityPercent` clamps.
 *
 * A sprint with NO target renders the planned points alone. "18 / 0" would
 * claim a capacity of zero, and 0% of nothing is not a bar worth drawing.
 *
 * The fill is `brand-600`, not `brand-500`: the rail is `surface-sunken` and
 * the deeper step is the one that still reads against it in light. It is the
 * same value `success` resolves to there, which is what `SprintProgress` puts
 * on the identical rail — the two bars should not be two greens.
 *
 * `width` is `style` because it is a computed percentage — the one dynamic
 * value the house rules allow.
 */
const FILL = "block h-full rounded-xs transition-[width] duration-100 ease-standard";

export function CapacityMeter({
  points,
  capacity,
}: {
  /** Story points across the tasks currently in the sprint. */
  points: number;
  /** The sprint's target. Absent on a sprint nobody has forecast. */
  capacity?: number;
}) {
  const over = isOverCapacity(points, capacity);

  return (
    <div className="min-w-32">
      <p className="flex items-baseline gap-1 tabular-nums">
        <span
          className={cn(
            "text-lg font-semibold",
            over ? "text-danger" : "text-text",
          )}
        >
          {points}
        </span>
        {capacity === undefined ? (
          <span className="text-xs text-text-subtle">pts planned</span>
        ) : (
          <span className="text-xs text-text-subtle">
            <span aria-hidden="true">/ {capacity} pts</span>
            <span className="sr-only">
              of {capacity} story points of capacity
            </span>
          </span>
        )}
      </p>

      {capacity !== undefined && (
        <div
          aria-hidden="true"
          className="mt-1 h-1.5 w-full overflow-hidden rounded-xs bg-surface-sunken"
        >
          <span
            style={{ width: `${capacityPercent(points, capacity)}%` }}
            className={cn(FILL, over ? "bg-danger" : "bg-brand-600")}
          />
        </div>
      )}

      {over && (
        <p className="mt-1 text-2xs text-text-muted">
          {points - (capacity ?? 0)} pts over capacity
        </p>
      )}
    </div>
  );
}
