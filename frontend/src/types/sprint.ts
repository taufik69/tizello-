/*
 * A sprint as the SPRINTS SCREEN knows it — a fixed time-box inside one
 * project, with the roll-up numbers a card shows.
 *
 * WHY THIS IS NOT `Sprint` FROM `board.ts`
 * ----------------------------------------
 * `board.ts` already exports `Sprint` (`{ number, startsOn, endsOn, closedOn }`).
 * That one is the *board header's* stamp: four fields, no name, no goal, and a
 * state inferred from whether `closedOn` is set. This one is the *record* — the
 * row the sprints list creates, edits, starts, completes and deletes.
 *
 * They are deliberately two types, exactly as `Project` (the workspace tile)
 * and `ProjectRecord` (the full row) are two types. The board stamp must not
 * grow six fields it never reads, and the record must not pretend a nullable
 * `closedOn` can express PLANNING. When a real API lands, `Sprint` becomes a
 * projection of `SprintRecord` and the board keeps its narrow prop.
 *
 * Uppercase members, matching `ProjectStatus` and `WorkspaceRole` — that is how
 * an enum arrives from an API, and it keeps the display string a UI concern
 * rather than a stored one.
 */

/**
 * Canonical order — and it is DISPLAY order, not lifecycle order. A sprint runs
 * PLANNING → ACTIVE → COMPLETED, but the list puts the sprint being worked on
 * at the top, what is queued behind it next, and the archive last. The grouping
 * helper reads this array, so this is the single source of that order.
 *
 * Exactly one sprint may be ACTIVE at a time. Nothing in the type system can
 * enforce that; `startSprint` in `sprint-edit.ts` is where it is enforced.
 */
export const SPRINT_STATES = ["ACTIVE", "PLANNING", "COMPLETED"] as const;
export type SprintState = (typeof SPRINT_STATES)[number];

export type SprintRecord = {
  /** The human key on the card — `"SPR-13"`, not a UUID. */
  id: string;
  name: string;
  /** ISO date, `YYYY-MM-DD`. Both required: a sprint is a time-box or it is a backlog. */
  startDate: string;
  endDate: string;
  state: SprintState;
  /** One sentence on what the sprint is for. Absent on plenty of real sprints. */
  goal?: string;
  /** Tasks pulled in. `0` on a sprint nobody has planned into yet. */
  itemCount: number;
  /** Estimated points across those tasks. Unestimated tasks contribute nothing. */
  totalPoints: number;
  /** How many of `itemCount` are done. Always `<= itemCount`. */
  doneCount: number;
};

/**
 * The editor's working copy. Flat and all-strings, because that is what a form
 * holds — `goal: ""` rather than `undefined`, so an empty field is a value and
 * not a hole in the object.
 *
 * The counts are absent on purpose: `itemCount`, `totalPoints` and `doneCount`
 * are roll-ups of the tasks in the sprint, and sprint planning is what changes
 * them. This form cannot.
 */
export type SprintDraft = {
  name: string;
  startDate: string;
  endDate: string;
  goal: string;
};
