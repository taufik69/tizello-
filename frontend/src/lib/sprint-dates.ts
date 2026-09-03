/*
 * Date arithmetic on `YYYY-MM-DD` strings.
 *
 * Everything here is a pure function of its arguments. NOTHING calls
 * `new Date()` with no argument — `demo-projects.ts` documents why at length:
 * "now" is a different instant on the server than it is at hydration, so a
 * value derived from it changes between the two passes and React throws the
 * node away. `DEMO_TODAY` is the pinned today, and it is passed in.
 *
 * `Date.UTC` throughout, so a host in a negative offset cannot roll a date back
 * a day. `format-date.ts` pins the same time zone on the display side.
 */

/** `"2026-09-03"` → `[2026, 8, 3]`, month zero-based, as `Date.UTC` wants it. */
function parts(iso: string): [number, number, number] {
  const [year, month, day] = iso.split("-").map(Number);
  return [year ?? 0, (month ?? 1) - 1, day ?? 1];
}

function toUtc(iso: string): number {
  return Date.UTC(...parts(iso));
}

const DAY_MS = 86_400_000;

/** `addDays("2026-09-03", 13)` → `"2026-09-16"`. Negative counts go backwards. */
export function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * How long the time-box is, counting BOTH ends: a Monday-to-Friday sprint is
 * five days, not four. That is how a team says it out loud, so it is how the
 * card says it.
 */
export function daysInclusive(startDate: string, endDate: string): number {
  return Math.round((toUtc(endDate) - toUtc(startDate)) / DAY_MS) + 1;
}

/** Strictly after. A one-day sprint whose end equals its start is not valid. */
export function isAfter(later: string, earlier: string): boolean {
  return toUtc(later) > toUtc(earlier);
}

/** `true` while `today` sits inside the box, both ends included. */
export function isWithin(
  today: string,
  startDate: string,
  endDate: string,
): boolean {
  return toUtc(today) >= toUtc(startDate) && toUtc(today) <= toUtc(endDate);
}

/**
 * Days left in a running sprint, today included. Negative once the end date has
 * passed — a sprint that is late is a thing worth being able to see, so the
 * caller decides how to word it rather than getting a clamped 0.
 */
export function daysRemaining(today: string, endDate: string): number {
  return Math.round((toUtc(endDate) - toUtc(today)) / DAY_MS) + 1;
}
