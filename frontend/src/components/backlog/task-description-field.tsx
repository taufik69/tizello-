"use client";

import { useId } from "react";

/*
 * The one multi-line field in the editor. `TextField` owns single-line inputs
 * and their validate-on-blur timing; a textarea shares the anatomy — 12px/600
 * label, same border and radius — but not the behaviour, so it is written out
 * here rather than bolted onto that component.
 *
 * `resize-y`: growing it is useful, and letting it grow sideways would break
 * the dialog's layout.
 */
const FIELD =
  "mt-1 w-full resize-y rounded-sm border border-border bg-surface p-2.5 text-sm text-text transition-colors duration-100 ease-standard placeholder:text-text-subtle";

export function TaskDescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-text-muted">
        Description
      </label>
      <textarea
        id={id}
        name="description"
        rows={3}
        value={value}
        maxLength={2000}
        placeholder="What does done look like? Anything the next person needs."
        onChange={(event) => onChange(event.target.value)}
        className={FIELD}
      />
      <p className="mt-1 text-2xs text-text-subtle">Optional.</p>
    </div>
  );
}
