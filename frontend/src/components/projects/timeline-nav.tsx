import { LockedControl } from "@/components/ui/locked-control";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/table-icons";

/*
 * `‹ Today ›`. Stepping the window is not built, so both arrows and the label
 * are `LockedControl`s — present, self-explaining and inert — rather than
 * buttons with no handler.
 *
 * The label reads the WINDOW's own range, never a live clock. `DEMO_TODAY` is
 * a constant precisely so the server and the browser agree on what "today"
 * means; a `new Date()` here would undo that.
 */
const STEP = "size-6 rounded-sm text-text-muted";

export function TimelineNav({ rangeLabel }: { rangeLabel: string }) {
  return (
    <div className="flex items-center gap-0.5">
      <LockedControl
        reason="Stepping the timeline is not built yet"
        label="Previous period"
        className={STEP}
      >
        <ChevronLeftIcon className="size-3.5" />
      </LockedControl>

      <LockedControl
        reason="Jumping back to today is not built yet"
        label={`Today — showing ${rangeLabel}`}
        className="h-6 rounded-sm px-2 text-xs font-medium text-text-muted"
      >
        Today
      </LockedControl>

      <LockedControl
        reason="Stepping the timeline is not built yet"
        label="Next period"
        className={STEP}
      >
        <ChevronRightIcon className="size-3.5" />
      </LockedControl>
    </div>
  );
}
