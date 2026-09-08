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
  PLANNING: "bg-accent-subtle text-text-muted",
  ACTIVE: "bg-info-subtle text-text-muted",
  ON_HOLD: "bg-warning-subtle text-text-muted",
  COMPLETED: "bg-success-subtle text-text-muted",
  CANCELLED: "bg-danger-subtle text-text-muted",
};

/*
 * The 6px disc on a group header, a board column header and a legend row.
 *
 * These must sit on `surface`, never on `surface-sunken`: `success` on
 * `surface-sunken` is 2.59:1 in light and misses the 3:1 a meaningful
 * indicator needs, where on `surface` it is 3.06:1. Every header that uses one
 * is therefore untinted.
 *
 * BACKLOG is the one neutral — `text-subtle` is 3.68:1 on surface, which
 * clears the 3:1 an indicator needs. (`border-strong` is 1.70:1 and is
 * therefore not used for anything that carries meaning.) The set used to hold
 * two greys because the fixture had both BACKLOG and TODO; the API has no
 * TODO, and CANCELLED took the freed slot in `danger`.
 */
export const STATUS_DOT: Record<ProjectStatus, string> = {
  BACKLOG: "bg-text-subtle",
  PLANNING: "bg-accent",
  ACTIVE: "bg-info",
  ON_HOLD: "bg-warning",
  COMPLETED: "bg-success",
  CANCELLED: "bg-danger",
};

/** Donut arcs. Same values as the dots, as SVG strokes. */
export const STATUS_ARC: Record<ProjectStatus, string> = {
  BACKLOG: "stroke-text-subtle",
  PLANNING: "stroke-accent",
  ACTIVE: "stroke-info",
  ON_HOLD: "stroke-warning",
  COMPLETED: "stroke-success",
  CANCELLED: "stroke-danger",
};

/*
 * Timeline bars: a tinted fill for recognition, a hairline in the strong token
 * for the edge. The fill alone would be invisible — `success-subtle` against a
 * white track is 1.06:1 — so the border is what actually bounds the bar, and
 * every one of these clears 3:1 on `surface`.
 */
export const STATUS_BAR: Record<ProjectStatus, string> = {
  BACKLOG: "bg-surface-sunken border-text-subtle",
  PLANNING: "bg-accent-subtle border-accent",
  ACTIVE: "bg-info-subtle border-info",
  ON_HOLD: "bg-warning-subtle border-warning",
  COMPLETED: "bg-success-subtle border-success",
  CANCELLED: "bg-danger-subtle border-danger",
};

/*
 * Priority deliberately avoids `warning`: ON_HOLD already owns amber, and a
 * table showing both columns at once would read as two statements about the
 * same thing. Outline → neutral fill → red fill is a ramp of its own.
 *
 * URGENT and HIGH share the red family and separate by weight rather than hue:
 * a seventh tint would leave the ramp with no visible step, and there is no
 * "more than danger" token. `font-semibold` is already on `BADGE_BASE`, so the
 * distinction is the border — URGENT is the only chip that is both filled and
 * outlined.
 */
export const PRIORITY_CHIP: Record<ProjectPriority, string> = {
  URGENT: "border border-danger bg-danger-subtle text-text-muted",
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
