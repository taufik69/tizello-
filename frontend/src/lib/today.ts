/**
 * The date the app treats as "today", as a `YYYY-MM-DD` string.
 *
 * **Computed once on the server and passed down as a prop — never called in a
 * component that runs on both sides.** `new Date()` evaluated during render is
 * a different instant on the server than it is at hydration, so a Today marker
 * derived from it moves between the two passes and React throws the node away
 * with a mismatch warning. It also goes stale on a tab nobody reloads.
 * `format-date.ts` documents the same constraint for display; this is the
 * positioning half of it.
 *
 * This replaces `DEMO_TODAY`, which was a pinned constant because the data
 * around it was invented and a real clock would have drifted away from the
 * fixture's dates. The projects data is real now, so the date has to be too.
 *
 * `sv-SE` is not a localisation choice — it is the one common locale whose
 * short date format IS ISO 8601, which avoids hand-rolling a zero-padded
 * formatter. `UTC` pins the day boundary so two users in different zones agree
 * about which day a bar starts on.
 */
export function todayIso(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "UTC" }).format(new Date());
}
