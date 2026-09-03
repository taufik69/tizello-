import type { SprintState } from "@/types/sprint";

/*
 * Every colour the sprints list uses, as COMPLETE class strings.
 *
 * Nothing here is built by interpolation — `` `bg-${state}-subtle` `` would not
 * survive Tailwind's plain-text scan of this file, so a state would silently
 * render unstyled.
 *
 * The three hues are the ones `project-tone.ts` already assigns to the same
 * three ideas: plum for a preparatory phase, blue for work in flight, green for
 * done. A sprint in PLANNING and a project in PLANNING are the same statement,
 * and giving them two palettes would make them look like two.
 *
 * The ink is `text-text-muted` on every chip, which is the finding rather than
 * a shortcut — see the contrast table in DESIGN-SYSTEM.md. A `-subtle` fill
 * does not pair with its own strong token at 11px; `text-text-muted` clears AA
 * on all of them in both themes. The strong tokens appear as dots and bar
 * fills, where the bar is 3:1.
 */

/** Chip fill + ink. Composed onto `BADGE_BASE`, which sets no colour. */
export const STATE_CHIP: Record<SprintState, string> = {
  ACTIVE: "bg-info-subtle text-text-muted",
  PLANNING: "bg-accent-subtle text-text-muted",
  COMPLETED: "bg-success-subtle text-text-muted",
};

/**
 * The disc on a group heading. These sit on `bg-canvas`/`bg-surface`, never on
 * `bg-surface-sunken`: `success` on `surface-sunken` is 2.59:1 in light and
 * misses the 3:1 an indicator needs. The state word is always beside them, so
 * the dot is never the sole carrier.
 */
export const STATE_DOT: Record<SprintState, string> = {
  ACTIVE: "bg-info",
  PLANNING: "bg-accent",
  COMPLETED: "bg-success",
};

/**
 * The progress bar's fill, on a `surface-sunken` rail.
 *
 * PLANNING gets a neutral rather than plum: a sprint that has not started has
 * nothing done by definition, so a coloured bar at 0% would be a coloured
 * nothing. The bar only carries meaning on the other two.
 */
export const PROGRESS_FILL: Record<SprintState, string> = {
  ACTIVE: "bg-info",
  PLANNING: "bg-text-subtle",
  COMPLETED: "bg-success",
};

/**
 * The active sprint's card, highlighted. A tinted border rather than a fill or
 * a shadow: the cards are flat and bordered per DESIGN-SYSTEM.md, tinting the
 * surface would drop the progress bar below the contrast it needs, and
 * elevation is reserved for things that actually overlay something.
 */
export const CARD_BORDER: Record<SprintState, string> = {
  ACTIVE: "border-info",
  PLANNING: "border-border",
  COMPLETED: "border-border",
};
