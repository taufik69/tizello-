import { addDays, isAfter } from "@/lib/sprint-dates";
import { activeSprint } from "@/lib/sprint-groups";
import type { SprintDraft, SprintRecord } from "@/types/sprint";

/*
 * Turning a sprint into a form, a form back into a sprint, and the three state
 * transitions.
 *
 * Pure and framework-free, so the panel leaf holds a list and a handful of
 * handlers and nothing else. When a real API lands these become the body of the
 * Server Action's payload builder rather than being deleted — `lib/sprint.ts`
 * already holds the card-moving half of the same story.
 *
 * NOTHING HERE PERSISTS. Every caller keeps the result in `useState`; a refresh
 * restores the fixture.
 */

/** Two weeks, counting both ends — the default a new sprint is pre-filled with. */
const DEFAULT_LENGTH_DAYS = 14;

/**
 * The composer's starting value. `today` is passed in rather than read from the
 * clock: see the note at the top of `sprint-dates.ts`.
 */
export function emptyDraft(name: string, today: string): SprintDraft {
  return {
    name,
    startDate: today,
    endDate: addDays(today, DEFAULT_LENGTH_DAYS - 1),
    goal: "",
  };
}

/** The editor's starting value: an existing sprint flattened, or a blank one. */
export function draftFromSprint(
  sprint: SprintRecord | null,
  fallback: SprintDraft,
): SprintDraft {
  if (!sprint) return fallback;

  return {
    name: sprint.name,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    goal: sprint.goal ?? "",
  };
}

export const NAME_REQUIRED = "Give the sprint a name.";
export const DATES_REQUIRED = "A sprint needs both a start and an end date.";
export const END_BEFORE_START = "The end date has to be after the start date.";

/** Which field is wrong, and why. Empty object means the draft is submittable. */
export type SprintDraftErrors = { name?: string; endDate?: string };

/**
 * Client-side validation, and it is a CONVENIENCE — the same shape the auth
 * forms use. When a real endpoint exists it validates again at the boundary,
 * because nothing arriving from a browser is a control.
 */
export function validateDraft(draft: SprintDraft): SprintDraftErrors {
  const errors: SprintDraftErrors = {};

  if (!draft.name.trim()) errors.name = NAME_REQUIRED;

  if (!draft.startDate || !draft.endDate) {
    errors.endDate = DATES_REQUIRED;
  } else if (!isAfter(draft.endDate, draft.startDate)) {
    errors.endDate = END_BEFORE_START;
  }

  return errors;
}

/**
 * A draft, re-inflated. An empty goal becomes an absent field rather than an
 * empty one — a sprint with `goal: ""` would render a blank line where a sprint
 * with no goal renders nothing.
 *
 * The roll-ups are carried over from `base` when editing and start at zero when
 * creating. This form cannot change them: they count the tasks in the sprint,
 * and sprint planning is the only thing that moves those.
 */
export function sprintFromDraft(
  draft: SprintDraft,
  { id, base }: { id: string; base: SprintRecord | null },
): SprintRecord {
  const goal = draft.goal.trim();

  return {
    id,
    name: draft.name.trim(),
    startDate: draft.startDate,
    endDate: draft.endDate,
    state: base?.state ?? "PLANNING",
    ...(goal ? { goal } : {}),
    itemCount: base?.itemCount ?? 0,
    totalPoints: base?.totalPoints ?? 0,
    doneCount: base?.doneCount ?? 0,
    /* Carried, not re-derived: the capacity target is set elsewhere and this
       form has no field for it, so rebuilding the record without it would
       silently erase the number planning measures against. Absent stays
       absent rather than becoming 0 — unknown is not zero. */
    ...(base?.capacityPoints ? { capacityPoints: base.capacityPoints } : {}),
  };
}

/** Replaces the sprint with the same id, or appends when there is none. */
export function upsertSprint(
  sprints: SprintRecord[],
  sprint: SprintRecord,
): SprintRecord[] {
  const exists = sprints.some((current) => current.id === sprint.id);
  return exists
    ? sprints.map((current) => (current.id === sprint.id ? sprint : current))
    : [...sprints, sprint];
}

export function removeSprint(
  sprints: SprintRecord[],
  id: string,
): SprintRecord[] {
  return sprints.filter((sprint) => sprint.id !== id);
}

/**
 * PLANNING → ACTIVE.
 *
 * The single-active rule is enforced HERE, not in the menu that calls it: a
 * second entry point would otherwise be one forgotten check away from two
 * running sprints. A sprint that is not in PLANNING, or a request made while
 * another sprint is already running, returns the list untouched — the UI
 * disables the control for both cases, so this is the backstop rather than the
 * message.
 */
export function startSprint(
  sprints: SprintRecord[],
  id: string,
): SprintRecord[] {
  const target = sprints.find((sprint) => sprint.id === id);
  if (!target || target.state !== "PLANNING") return sprints;
  if (activeSprint(sprints)) return sprints;

  return sprints.map((sprint) =>
    sprint.id === id ? { ...sprint, state: "ACTIVE" as const } : sprint,
  );
}

/**
 * ACTIVE → COMPLETED. One-way: there is no reopen, here or in the real
 * workflow — `closeSprint` in `lib/sprint.ts` moves the unfinished cards back
 * to the backlog, and that is not something an undo could put back.
 */
export function completeSprint(
  sprints: SprintRecord[],
  id: string,
): SprintRecord[] {
  return sprints.map((sprint) =>
    sprint.id === id && sprint.state === "ACTIVE"
      ? { ...sprint, state: "COMPLETED" as const }
      : sprint,
  );
}
