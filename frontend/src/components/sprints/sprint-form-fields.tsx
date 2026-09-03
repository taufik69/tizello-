"use client";

import { SprintGoalField } from "@/components/sprints/sprint-goal-field";
import { TextField } from "@/components/ui/text-field";
import { plural } from "@/lib/plural";
import { daysInclusive, isAfter } from "@/lib/sprint-dates";
import type { SprintDraft } from "@/types/sprint";

/*
 * Everything in the editor below the name. Split out so `SprintDialog` is the
 * dialog, the validation and the footer, and nothing else — either half alone
 * would crowd the 150-line cap.
 *
 * The two dates are a `grid`, not a flex row: at 360px a native date control is
 * already close to the full width of the viewport, so they stack, and they only
 * sit side by side from `sm` up.
 */
export function SprintFormFields({
  draft,
  error,
  onChange,
}: {
  draft: SprintDraft;
  /** The cross-field message, from submit. Hangs off the end date. */
  error?: string;
  onChange: (patch: Partial<SprintDraft>) => void;
}) {
  const valid =
    Boolean(draft.startDate && draft.endDate) &&
    isAfter(draft.endDate, draft.startDate);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={draft.startDate}
          onValueChange={(startDate) => onChange({ startDate })}
        />

        <TextField
          label="End date"
          name="endDate"
          type="date"
          defaultValue={draft.endDate}
          error={error}
          /* The length is a consequence of the two dates, so it is stated
             where the second one is entered rather than as a third field
             somebody could contradict. Both ends counted, which is how a team
             says it out loud. */
          helper={
            valid
              ? `${plural(daysInclusive(draft.startDate, draft.endDate), "day", "days")}, both ends included.`
              : undefined
          }
          onValueChange={(endDate) => onChange({ endDate })}
        />
      </div>

      <SprintGoalField
        value={draft.goal}
        onChange={(goal) => onChange({ goal })}
      />
    </>
  );
}
