/*
 * Deterministic date formatting for anything that renders a stored timestamp.
 *
 * Both the locale and the time zone are pinned, and that is the whole point.
 * `toLocaleDateString()` with no arguments resolves against the *host* — the
 * container's locale on the server, the user's in the browser. The two disagree
 * ("21/08/2026" vs "8/21/2026"), React sees different text on either side of
 * hydration, and the node is thrown away with a mismatch warning. Pinning both
 * makes the output a pure function of the ISO string.
 *
 * Relative time ("3 days ago") is deliberately absent. It depends on `now`,
 * which is a different instant on the server than it is at hydration, and it
 * goes stale on a tab nobody reloads. If it is ever wanted it has to be
 * computed in an effect after mount, never during render.
 */
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** `"2026-08-21T09:12:00.000Z"` → `"21 Aug 2026"`. */
export function formatDate(iso: string): string {
  return DAY_MONTH_YEAR.format(new Date(iso));
}
