import type { ProjectPriority, ProjectStatus } from "@/types/project";

/*
 * Every colour the Projects views use, as COMPLETE class strings.
 *
 * Nothing here is built by interpolation — `` `bg-${status}-subtle` `` would
 * not survive Tailwind's plain-text scan of this file, so a status would
 * silently render unstyled. Five lookups, one per role the colour plays.
 *
 * The ink is `text-text-muted` on every chip, and that is the finding rather
 * than a shortcut. Measured against the token values in DESIGN-SYSTEM.md at
 * 11px, a `-subtle` fill does NOT pair with its own strong token:
 *
 *   text-success on bg-success-subtle   2.82:1 light  — fails AA
 *   text-warning on bg-warning-subtle   3.27:1 light  — fails AA
 *   text-info    on bg-info-subtle      4.63:1 light  — passes, barely
 *   text-text-muted on ANY of them      5.70–6.44:1 both themes
 *
 * So the hue is carried by the fill, which is the part that has to be
 * recognisable at a glance, and the ink is the one value that clears AA on all
 * six fills in both themes. The strong tokens still appear — as dots, ring arcs
 * and bar rails, where the bar is 3:1 rather than 4.5:1.
 */

/** Chip fill + ink. Composed onto `BADGE_BASE`, which sets no colour. */
export const STATUS_CHIP: Record<ProjectStatus, string> = {
  BACKLOG: "bg-surface-sunken text-text-muted",
  TODO: "border border-border text-text-muted",
  PLANNING: "bg-accent-subtle text-text-muted",
  IN_PROGRESS: "bg-info-subtle text-text-muted",
  PAUSED: "bg-warning-subtle text-text-muted",
  COMPLETE: "bg-success-subtle text-text-muted",
};

/*
 * The 6px disc on a group header, a board column header and a legend row.
 *
 * These must sit on `surface`, never on `surface-sunken`: `success` on
 * `surface-sunken` is 2.59:1 in light and misses the 3:1 a meaningful
 * indicator needs, where on `surface` it is 3.06:1. Every header that uses one
 * is therefore untinted.
 *
 * BACKLOG and TODO are the two neutrals, separated by weight — `text-subtle`
 * is 3.68:1 on surface and `text-muted` is 6.45:1, so they read as two greys
 * rather than one. `border-strong` was the obvious third neutral and is 1.70:1;
 * it is not used for anything that carries meaning.
 */
export const STATUS_DOT: Record<ProjectStatus, string> = {
  BACKLOG: "bg-text-subtle",
  TODO: "bg-text-muted",
  PLANNING: "bg-accent",
  IN_PROGRESS: "bg-info",
  PAUSED: "bg-warning",
  COMPLETE: "bg-success",
};

/** Donut arcs. Same values as the dots, as SVG strokes. */
export const STATUS_ARC: Record<ProjectStatus, string> = {
  BACKLOG: "stroke-text-subtle",
  TODO: "stroke-text-muted",
  PLANNING: "stroke-accent",
  IN_PROGRESS: "stroke-info",
  PAUSED: "stroke-warning",
  COMPLETE: "stroke-success",
};

/*
 * Timeline bars: a tinted fill for recognition, a hairline in the strong token
 * for the edge. The fill alone would be invisible — `success-subtle` against a
 * white track is 1.06:1 — so the border is what actually bounds the bar, and
 * every one of these clears 3:1 on `surface`.
 */
export const STATUS_BAR: Record<ProjectStatus, string> = {
  BACKLOG: "bg-surface-sunken border-text-subtle",
  TODO: "bg-surface-sunken border-text-muted",
  PLANNING: "bg-accent-subtle border-accent",
  IN_PROGRESS: "bg-info-subtle border-info",
  PAUSED: "bg-warning-subtle border-warning",
  COMPLETE: "bg-success-subtle border-success",
};

/*
 * Priority deliberately avoids `warning`: Paused already owns amber, and a
 * table showing both columns at once would read as two statements about the
 * same thing. Outline → neutral fill → red fill is a ramp of its own.
 */
export const PRIORITY_CHIP: Record<ProjectPriority, string> = {
  HIGH: "bg-danger-subtle text-text-muted",
  MEDIUM: "bg-surface-sunken text-text-muted",
  LOW: "border border-border text-text-muted",
};

/** The timeline groups by phase, not by status, so it needs its own three. */
export const PHASE_DOT = {
  TODO: "bg-text-muted",
  IN_PROGRESS: "bg-info",
  COMPLETE: "bg-success",
} as const;
