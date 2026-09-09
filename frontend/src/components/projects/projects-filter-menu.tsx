"use client";

import { MenuAction, MenuChoice, MenuHeading } from "@/components/projects/menu-choice";
import { PRIORITY_CHIP } from "@/components/projects/project-tone";
import { StatusDot } from "@/components/projects/status-dot";
import { ToolbarMenu } from "@/components/projects/toolbar-menu";
import { useFilterNav } from "@/components/projects/use-filter-nav";
import { BADGE_BASE } from "@/components/ui/badge";
import { FilterIcon } from "@/components/ui/table-icons";
import { cn } from "@/lib/cn";
import { activeFilterCount, type ProjectFilters } from "@/lib/project-filters";
import { STATUS_LABEL } from "@/lib/project-groups";
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectView,
} from "@/types/project";

/**
 * Status, priority and "only mine" — the three narrowings the list endpoint
 * can actually do (`lib/projects.ts`), which is why these three and not more.
 *
 * ONE STATUS AT A TIME, NOT A SET, and that is the API's shape rather than a
 * simplification: `?status=` takes a single value. Offering checkboxes would
 * promise a union the server cannot answer, and faking it by filtering the
 * response would break as soon as a workspace passes the 100-row page cap —
 * the rows to union would not all be in the payload.
 *
 * CLICKING THE CHOSEN VALUE CLEARS IT. A radio set with no visible "Any" row
 * is a trap: once you pick a status there is no way back to all of them.
 * Re-clicking is the same gesture the icon row in the create drawer uses, and
 * the Clear line below is the explicit route for when the whole set is on.
 *
 * The trigger keeps its dot while anything is on, INCLUDING the search term,
 * which lives in its own control. Two independent narrowings with two
 * independent indicators is how you end up staring at an empty list wondering
 * which one did it.
 */
const PANEL_HEIGHT = 400;

export function ProjectsFilterMenu({
  workspaceId,
  view,
  filters,
}: {
  workspaceId: string;
  view: ProjectView;
  filters: ProjectFilters;
}) {
  const go = useFilterNav({ workspaceId, view, filters });
  const active = activeFilterCount(filters);

  return (
    <ToolbarMenu
      icon={<FilterIcon className="size-3.5" />}
      label={active > 0 ? `Filter projects, ${active} active` : "Filter projects"}
      closeOnSelect
      panelLabel="Filter projects"
      height={PANEL_HEIGHT}
      dot={active > 0}
    >
      <>
        <MenuHeading>Status</MenuHeading>
        {PROJECT_STATUSES.map((status) => (
          <MenuChoice
            key={status}
            label={STATUS_LABEL[status]}
            selected={filters.status === status}
            adornment={<StatusDot status={status} />}
            onSelect={() => go({ status: filters.status === status ? undefined : status })}
          />
        ))}

        <MenuHeading>Priority</MenuHeading>
        {PROJECT_PRIORITIES.map((priority) => (
          <MenuChoice
            key={priority}
            label={priority.charAt(0) + priority.slice(1).toLowerCase()}
            selected={filters.priority === priority}
            adornment={
              <span className={cn(BADGE_BASE, PRIORITY_CHIP[priority], "px-1 py-0")}>
                {priority.charAt(0)}
              </span>
            }
            onSelect={() => go({ priority: filters.priority === priority ? undefined : priority })}
          />
        ))}

        <MenuHeading>Mine</MenuHeading>
        <MenuChoice
          checkbox
          label="Only projects I'm on"
          selected={filters.mine}
          onSelect={() => go({ mine: !filters.mine })}
        />

        <MenuAction
          label="Clear filters"
          disabled={active === 0}
          onClick={() => go({ q: undefined, status: undefined, priority: undefined, mine: false })}
        />
      </>
    </ToolbarMenu>
  );
}
