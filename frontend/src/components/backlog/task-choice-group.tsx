"use client";

/*
 * A segmented control built on real radios rather than a div-with-onClick:
 * grouping, arrow-key navigation, Home/End and the announcement of "2 of 4"
 * all come from the browser, and there is no roving tabindex to get wrong.
 * Same treatment as `InviteRoleChoice`, generalised because the editor needs
 * two of them.
 *
 * The input is `sr-only`, so the base layer's focus ring would land on a hidden
 * box. `peer-focus-visible` forwards that same 2px ring to the visible segment
 * — the one focus treatment, relocated, not a second one.
 */
const SEGMENT =
  "cursor-pointer rounded-xs px-2.5 py-1 text-xs font-medium text-text-muted transition-colors duration-100 ease-standard peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-checked:bg-brand-500 peer-checked:font-semibold peer-checked:text-on-brand hover:bg-surface-hover hover:text-text peer-checked:hover:bg-brand-500 peer-checked:hover:text-on-brand";

export type Choice = { value: string; label: string };

export function TaskChoiceGroup({
  legend,
  name,
  choices,
  value,
  hint,
  onChange,
}: {
  legend: string;
  /** The radio group's form name, so the segments share one selection. */
  name: string;
  choices: readonly Choice[];
  value: string;
  hint?: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-text-muted">{legend}</legend>

      {/* Wraps rather than scrolls: six point values do not fit one line at
          360px, and a hidden option is an option nobody picks. */}
      <div className="mt-1 flex flex-wrap gap-0.5 rounded-sm border border-border bg-surface p-0.5">
        {choices.map((choice) => (
          <label key={choice.value} className="inline-flex">
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={value === choice.value}
              onChange={() => onChange(choice.value)}
              className="peer sr-only"
            />
            <span className={SEGMENT}>{choice.label}</span>
          </label>
        ))}
      </div>

      {hint && <p className="mt-1.5 text-2xs text-text-subtle">{hint}</p>}
    </fieldset>
  );
}
