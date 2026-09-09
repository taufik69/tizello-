/*
 * Month-grid maths for the date picker. Pure, and deliberately free of any
 * `new Date()` with no argument — "today" is passed in, for the reason
 * `format-date.ts` spells out at length: a clock read during render is a
 * different instant on the server than at hydration.
 *
 * EVERY DATE HERE IS A `YYYY-MM-DD` STRING, NOT A `Date`. A `Date` carries a
 * time and a zone, and a picker that stores one turns "8 Sep" into "7 Sep,
 * 23:00" for anybody west of UTC. Arithmetic goes through `Date.UTC`, which is
 * zone-free by construction; the string is what enters and leaves.
 */

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/** Six rows, always. A grid that is 5 rows one month and 6 the next makes the popover jump height as you page through it. */
const WEEKS = 6;
const DAYS_PER_WEEK = 7;

export type CalendarDay = {
  /** `YYYY-MM-DD`. */
  iso: string;
  /** 1–31, as shown in the cell. */
  day: number;
  /** False for the leading/trailing days borrowed from the neighbouring months. */
  inMonth: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

/** `{ year, month }` (month 0-indexed) → `YYYY-MM-DD`. */
const toIso = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

/**
 * Parses `YYYY-MM-DD` into its parts, or `null` for anything else — a
 * half-typed value in the text input is the common case, not an error.
 * Rejects a date that does not exist (`2026-02-31`) by round-tripping it
 * through `Date.UTC` and checking the day survived.
 */
export function parseIsoDate(
  value: string,
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  const stamp = new Date(Date.UTC(year, month, day));
  if (stamp.getUTCMonth() !== month || stamp.getUTCDate() !== day) return null;

  return { year, month, day };
}

/**
 * The 42 cells of a month grid, starting on the Sunday on or before the 1st.
 *
 * `Date.UTC` normalises out-of-range days for us — `Date.UTC(2026, 8, 0)` is
 * 31 Aug — so the leading and trailing runs need no branch of their own.
 */
export function monthGrid(year: number, month: number): CalendarDay[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const cells: CalendarDay[] = [];

  for (let index = 0; index < WEEKS * DAYS_PER_WEEK; index += 1) {
    const stamp = new Date(Date.UTC(year, month, index - firstWeekday + 1));
    const cellMonth = stamp.getUTCMonth();

    cells.push({
      iso: toIso(stamp.getUTCFullYear(), cellMonth, stamp.getUTCDate()),
      day: stamp.getUTCDate(),
      inMonth: cellMonth === month,
    });
  }

  return cells;
}

/** Steps the visible month by `delta`, rolling the year over. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const stamp = new Date(Date.UTC(year, month + delta, 1));
  return { year: stamp.getUTCFullYear(), month: stamp.getUTCMonth() };
}

/* Pinned locale and time zone, same rule as `format-date.ts`: the output has
   to be a pure function of its input, not of the host. */
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const FULL_DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** `2026, 8` → `"Sep 2026"`. */
export function formatMonthYear(year: number, month: number): string {
  return MONTH_YEAR.format(new Date(Date.UTC(year, month, 1)));
}

/** `"2026-09-08"` → `"Sep 8, 2026"`. Empty in, empty out — an unset date is a blank field, not "Invalid Date". */
export function formatPickerDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return "";

  return FULL_DATE.format(new Date(Date.UTC(parts.year, parts.month, parts.day)));
}
