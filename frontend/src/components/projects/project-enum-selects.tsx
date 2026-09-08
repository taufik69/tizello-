"use client";

import {
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_LABEL,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectPriority,
  type ProjectStatus,
} from "@/types/project";

/**
 * The Status and Priority selects, shared by the create and edit forms.
 *
 * One component rather than the same two `<select>` blocks in both: the option
 * lists come from the API's enums, and two copies is two places for a new
 * status to be added to only one of them.
 *
 * Plain `<select>`s rather than a custom listbox — the native control is
 * keyboard-complete, works on touch, and these are six and four fixed options
 * with no search, no icons and no multi-select to justify rebuilding it.
 */
const SELECT =
  "h-8 w-full rounded-sm border border-border-strong bg-surface px-2 text-sm text-text";

export function ProjectEnumSelects({
  status,
  priority,
  onStatusChange,
  onPriorityChange,
}: {
  status: ProjectStatus;
  priority: ProjectPriority;
  onStatusChange: (status: ProjectStatus) => void;
  onPriorityChange: (priority: ProjectPriority) => void;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-text-muted">Status</span>
        <select
          name="status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ProjectStatus)}
          className={SELECT}
        >
          {PROJECT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {PROJECT_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-text-muted">Priority</span>
        <select
          name="priority"
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value as ProjectPriority)}
          className={SELECT}
        >
          {PROJECT_PRIORITIES.map((value) => (
            <option key={value} value={value}>
              {PROJECT_PRIORITY_LABEL[value]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
