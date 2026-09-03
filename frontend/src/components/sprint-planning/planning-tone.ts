/*
 * The planning screen's shared geometry, as COMPLETE class strings.
 *
 * Both panels are the same object — a bordered well with a sticky-feeling
 * header and a list inside — so the chrome lives here rather than being typed
 * out twice and drifting by a padding step. Nothing is built by interpolation.
 *
 * `rounded-lg` because these are panels, not cards: DESIGN-SYSTEM.md puts lists
 * and panels at 12px and cards at 8px, and the rows inside are the cards.
 */

/** The panel shell. Flat and bordered; elevation is for the dialog only. */
export const PANEL = "rounded-lg border border-border bg-surface p-3";

/** The strip above each list: title, count, and whatever the panel adds. */
export const PANEL_HEADER =
  "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-b border-border pb-2";

/**
 * A task row. The hover fill is the same `surface-hover` a backlog row takes —
 * the row is not itself clickable here (the action lives in its rail), but the
 * two screens showing the same task should not feel like two different lists.
 */
export const ROW =
  "group flex items-start gap-2 rounded-md border border-border bg-surface p-2 transition-colors duration-100 ease-standard hover:bg-surface-hover";

/**
 * The list well behind the rows. `surface-sunken` marks it as the container
 * work moves INTO, which is the one idea this screen is about, and it caps its
 * height so a twelve-item backlog cannot push the sprint panel off the fold on
 * a desktop two-column layout.
 */
export const LIST =
  "mt-2 max-h-[28rem] space-y-1.5 overflow-y-auto rounded-md bg-surface-sunken p-1.5";
