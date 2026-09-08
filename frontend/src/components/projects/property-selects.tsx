"use client";

import { PropertyRow } from "@/components/projects/property-row";
import { PRIORITY_CHIP } from "@/components/projects/project-tone";
import { SelectMenu, type SelectOption } from "@/components/projects/select-menu";
import { StatusDot } from "@/components/projects/status-dot";
import { cn } from "@/lib/cn";
import {
  PROJECT_PRIORITIES,
  PROJECT_PRIORITY_LABEL,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type ProjectPriority,
  type ProjectStatus,
} from "@/types/project";

/**
 * Status and Priority, as two ordinary property rows.
 *
 * They used to be a two-column grid of their own with the label ABOVE each
 * select, which broke the alignment of the whole list — every other row puts
 * its label in the left column. Two `PropertyRow`s cost one extra line of
 * vertical space and make the left edge a line.
 *
 * Both are `SelectMenu` now rather than a native `<select>`. The tone lookups
 * in `project-tone.ts` are what every other surface uses to draw a status and
 * a priority; a UA option list can carry neither, so the one screen where you
 * CHOOSE one was the only screen where it had no colour. `select-menu.tsx`
 * documents what that costs and what is rebuilt to pay for it.
 *
 * The options are built once at module scope, not per render: they are six and
 * four fixed values, and rebuilding four React elements on every keystroke in
 * the title field is work for nothing.
 */
const STATUS_OPTIONS: readonly SelectOption<ProjectStatus>[] = PROJECT_STATUSES.map(
  (value) => ({
    value,
    label: PROJECT_STATUS_LABEL[value],
    adornment: <StatusDot status={value} />,
  }),
);

/* The same chip the table, the board card and the detail header draw — a
   priority is recognised by its fill, so the picker shows the fill. */
const PRIORITY_OPTIONS: readonly SelectOption<ProjectPriority>[] =
  PROJECT_PRIORITIES.map((value) => ({
    value,
    label: PROJECT_PRIORITY_LABEL[value],
    adornment: (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-3 shrink-0 rounded-xs",
          PRIORITY_CHIP[value],
        )}
      />
    ),
  }));

export function PropertySelects({
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
    <>
      <PropertyRow label="Status" icon="status">
        <SelectMenu
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={onStatusChange}
        />
      </PropertyRow>

      <PropertyRow label="Priority" icon="flag">
        <SelectMenu
          label="Priority"
          value={priority}
          options={PRIORITY_OPTIONS}
          onChange={onPriorityChange}
        />
      </PropertyRow>
    </>
  );
}
