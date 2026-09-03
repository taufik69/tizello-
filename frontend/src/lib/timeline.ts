import type { ProjectRecord } from "@/types/project";

/*
 * The gantt's geometry, as pure arithmetic on ISO date strings.
 *
 * Everything is UTC day counts. `new Date()` with no argument is never called
 * — the window and the Today marker are both derived from the pinned
 * `DEMO_TODAY`, so the server and the browser compute identical offsets and
 * there is nothing for hydration to disagree about. Slicing to `YYYY-MM-DD`
 * and appending `T00:00:00Z` makes the parse explicit rather than trusting a
 * host's interpretation of a bare date.
 */

const MS_PER_DAY = 86_400_000;

/** Whole UTC days since the epoch. */
function toDay(iso: string): number {
  return Math.round(Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`) / MS_PER_DAY);
}

const MONTH = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  timeZone: "UTC",
});

export type TimelineMonth = {
  key: string;
  label: string;
  /** Days in this month — its share of the track. */
  days: number;
  /** Days from the window start to this month's first day. */
  offset: number;
};

export type TimelineWindow = {
  startDay: number;
  totalDays: number;
  months: TimelineMonth[];
  /** Where the pinned today sits, 0–100. */
  todayPercent: number;
  /** `‹ Today ›` reads the window's own range, not the live clock. */
  rangeLabel: string;
};

/** Four months, opening one month before the pinned today. */
const MONTH_COUNT = 4;
const MONTHS_BEFORE = 1;

export function timelineWindow(todayIso: string): TimelineWindow {
  const year = Number(todayIso.slice(0, 4));
  const monthIndex = Number(todayIso.slice(5, 7)) - 1 - MONTHS_BEFORE;

  const months: TimelineMonth[] = [];
  let offset = 0;
  for (let i = 0; i < MONTH_COUNT; i += 1) {
    const from = Date.UTC(year, monthIndex + i, 1) / MS_PER_DAY;
    const to = Date.UTC(year, monthIndex + i + 1, 1) / MS_PER_DAY;
    const date = new Date(from * MS_PER_DAY);
    /* The year rides along on January and on the opening month, so a window
       that straddles a new year is never ambiguous. */
    const showYear = i === 0 || date.getUTCMonth() === 0;
    months.push({
      key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`,
      label: showYear
        ? `${MONTH.format(date)} ${date.getUTCFullYear()}`
        : MONTH.format(date),
      days: to - from,
      offset,
    });
    offset += to - from;
  }

  const startDay = Date.UTC(year, monthIndex, 1) / MS_PER_DAY;
  const totalDays = offset;
  const first = months[0];
  const last = months[months.length - 1];

  return {
    startDay,
    totalDays,
    months,
    todayPercent: ((toDay(todayIso) - startDay) / totalDays) * 100,
    rangeLabel: `${first.label} – ${last.label}`,
  };
}

export type BarPlacement = {
  leftPercent: number;
  widthPercent: number;
  /** The bar runs past an edge of the window, so that end gets a flat corner. */
  clippedStart: boolean;
  clippedEnd: boolean;
};

/**
 * `null` for a project with no dates, and for one whose dates fall entirely
 * outside the window. Both are real rows that simply have no bar; the caller
 * says so in words rather than drawing a zero-width sliver.
 */
export function barPlacement(
  project: ProjectRecord,
  window: TimelineWindow,
): BarPlacement | null {
  if (!project.startDate || !project.endDate) return null;

  const windowEnd = window.startDay + window.totalDays;
  const from = toDay(project.startDate);
  /* End dates are inclusive, so a one-day project is one day wide. */
  const to = toDay(project.endDate) + 1;
  if (to <= window.startDay || from >= windowEnd) return null;

  const left = Math.max(from, window.startDay);
  const right = Math.min(to, windowEnd);

  return {
    leftPercent: ((left - window.startDay) / window.totalDays) * 100,
    widthPercent: ((right - left) / window.totalDays) * 100,
    clippedStart: from < window.startDay,
    clippedEnd: to > windowEnd,
  };
}

/** Week gridlines, as percentages across the track. */
export function weekTicks(window: TimelineWindow): number[] {
  const ticks: number[] = [];
  for (let day = 7; day < window.totalDays; day += 7) {
    ticks.push((day / window.totalDays) * 100);
  }
  return ticks;
}
