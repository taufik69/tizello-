import type { LabelColor } from "@/types/board";
import type { ProjectPriority } from "@/types/project";

/*
 * The backlog's colours, as COMPLETE class strings. Nothing is built by
 * interpolation — `` `bg-label-${color}` `` would not survive Tailwind's
 * plain-text scan of this file, so a tag would silently render unstyled.
 *
 * The chips themselves come from `project-tone.ts`: a backlog row's priority
 * badge is the SAME badge the projects table draws, and re-deriving it here
 * would be a second palette for one meaning.
 */

/**
 * The disc on a priority group header. `STATUS_DOT`'s reasoning applies
 * unchanged: these sit on `bg-surface`, never `bg-surface-sunken`, and the
 * priority word is always beside them, so the dot is never the sole carrier.
 *
 * Amber is avoided deliberately — `warning` is spoken for by Paused in the
 * projects views, and reusing it for Medium would make the two look like one
 * statement. Red → neutral ink → subtle grey is a ramp of its own, and matches
 * `PRIORITY_CHIP`.
 */
export const PRIORITY_DOT: Record<ProjectPriority, string> = {
  HIGH: "bg-danger",
  MEDIUM: "bg-text-muted",
  LOW: "bg-text-subtle",
};

/**
 * A tag's leading dot. Decorative only: the tag's name sits next to it in
 * `text-text-muted` on `surface-sunken`, so nobody has to tell purple from
 * blue to read the row.
 */
export const LABEL_DOT: Record<LabelColor, string> = {
  green: "bg-label-green",
  yellow: "bg-label-yellow",
  orange: "bg-label-orange",
  red: "bg-label-red",
  purple: "bg-label-purple",
  blue: "bg-label-blue",
};
