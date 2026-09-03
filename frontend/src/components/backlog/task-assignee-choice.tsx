"use client";

import { useId } from "react";
import type { ProjectPerson } from "@/types/project";

/*
 * A native `<select>`, not a custom listbox. The roster is five people today
 * and could be forty; the platform control already handles the keyboard, type-
 * ahead, and the mobile picker, and none of that would be free in a rebuild.
 *
 * `""` is Unassigned — a real option rather than a placeholder, because
 * clearing an assignee has to be as reachable as setting one.
 */
const SELECT =
  "mt-1 h-9 w-full rounded-sm border border-border bg-surface px-2 text-sm text-text transition-colors duration-100 ease-standard";

export function TaskAssigneeChoice({
  assignees,
  value,
  onChange,
}: {
  assignees: ProjectPerson[];
  value: string;
  onChange: (assigneeId: string) => void;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-text-muted">
        Assignee
      </label>
      <select
        id={id}
        name="assigneeId"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={SELECT}
      >
        <option value="">Unassigned</option>
        {assignees.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name}
          </option>
        ))}
      </select>
    </div>
  );
}
