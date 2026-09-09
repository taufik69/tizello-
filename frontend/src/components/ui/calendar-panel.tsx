"use client";

import {
  formatMonthYear,
  monthGrid,
  shiftMonth,
  WEEKDAY_LABELS,
} from "@/lib/calendar";
import { cn } from "@/lib/cn";

/**
 * The month grid itself — header, weekday row, 42 cells. Split from
 * `DateField` so the field owns the popover mechanics and this owns the
 * calendar, and so the 150-line cap is met without collapsing either.
 *
 * Always six rows (`monthGrid`), so paging from a 5-row month to a 6-row one
 * does not change the popover's height under the cursor.
 *
 * Cells are `<button type="button">`. Inside a `<form>` a bare `<button>`
 * submits, so clicking a day would save the dialog — the one bug this
 * component could plausibly ship with.
 */
const CELL =
  "grid size-8 place-items-center rounded-sm text-xs transition-colors duration-100 ease-standard";
const NAV =
  "grid size-6 place-items-center rounded-sm text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text";

export function CalendarPanel({
  year,
  month,
  selected,
  today,
  onMonthChange,
  onSelect,
}: {
  year: number;
  month: number;
  /** `YYYY-MM-DD`, or "" for an unset field. */
  selected: string;
  /** `YYYY-MM-DD`. Passed in, never read from a clock here — see `lib/calendar.ts`. */
  today: string;
  onMonthChange: (next: { year: number; month: number }) => void;
  onSelect: (iso: string) => void;
}) {
  const cells = monthGrid(year, month);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-text">
          {formatMonthYear(year, month)}
        </p>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              const parts = today.split("-");
              onMonthChange({ year: Number(parts[0]), month: Number(parts[1]) - 1 });
            }}
            className="rounded-sm px-1.5 py-0.5 text-2xs font-medium text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
          >
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => onMonthChange(shiftMonth(year, month, -1))}
            className={NAV}
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => onMonthChange(shiftMonth(year, month, 1))}
            className={NAV}
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            aria-hidden="true"
            className="grid size-8 place-items-center text-2xs font-medium text-text-subtle"
          >
            {label}
          </div>
        ))}

        {cells.map((cell) => {
          const isSelected = cell.iso === selected;
          const isToday = cell.iso === today;

          return (
            <button
              key={cell.iso}
              type="button"
              aria-label={cell.iso}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              onClick={() => onSelect(cell.iso)}
              className={cn(
                CELL,
                isSelected
                  ? "bg-brand-500 font-semibold text-on-brand"
                  : cell.inMonth
                    ? "text-text hover:bg-surface-hover"
                    : /* Borrowed from the neighbouring month: dim, but still
                         clickable — clicking one is how you page by a day
                         across a month boundary, which is what the grid
                         showing them is for. */
                      "text-text-subtle hover:bg-surface-hover",
                /* Today is a ring rather than a fill, so it can coexist with
                   the selected fill on the same cell. */
                isToday && !isSelected && "ring-1 ring-border-strong",
              )}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Local to this file: two 16px chevrons, the same 1.5 stroke as `ui/icons.tsx`.
   Not added there because nothing else needs a bare chevron at this size. */
function ChevronLeft() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
      <path d="M10 3.5L6 8l4 4.5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-3.5" aria-hidden="true">
      <path d="M6 3.5L10 8l-4 4.5" />
    </svg>
  );
}
