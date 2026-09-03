"use client";

import { LABEL_DOT } from "@/components/backlog/backlog-tone";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/cn";
import { BACKLOG_LABELS } from "@/types/backlog";

/*
 * The tag picker. A fixed catalogue, so checkboxes rather than free text: many
 * can be on at once, which rules out a radio group, and the browser already
 * announces "checked / not checked" per option.
 *
 * The colour is a trailing swatch, not the label itself — the six label hues
 * are mid-tone and carry no ink that clears AA in both themes, so the name does
 * the work and the dot is recognition.
 */
export function TaskLabelsChoice({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (labelId: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold text-text-muted">Labels</legend>

      <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {BACKLOG_LABELS.map((label) => (
          <span key={label.id} className="flex items-center gap-1.5">
            <Checkbox
              name="labelIds"
              label={label.name}
              checked={selected.includes(label.id)}
              onChange={() => onToggle(label.id)}
            />
            <span
              aria-hidden="true"
              className={cn("size-1.5 shrink-0 rounded-full", LABEL_DOT[label.color])}
            />
          </span>
        ))}
      </div>
    </fieldset>
  );
}
