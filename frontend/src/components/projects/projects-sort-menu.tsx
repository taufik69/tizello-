"use client";

import { MenuChoice, MenuHeading } from "@/components/projects/menu-choice";
import { ToolbarMenu } from "@/components/projects/toolbar-menu";
import { useFilterNav } from "@/components/projects/use-filter-nav";
import { SortIcon } from "@/components/ui/table-icons";
import {
  DEFAULT_SORT,
  NATURAL_DIRECTION,
  PROJECT_SORTS,
  PROJECT_SORT_LABEL,
  type ProjectFilters,
} from "@/lib/project-filters";
import type { ProjectView } from "@/types/project";

/**
 * Which field the list is ordered by, and which way.
 *
 * PICKING A FIELD DOES NOT PICK A DIRECTION. Each field has a natural one
 * (`NATURAL_DIRECTION`) — text ascends A→Z, dates descend newest-first — so
 * one click gives the order people meant, and the two rows at the bottom are
 * there for when they meant the other one. A single row that toggled through
 * "Name ↑ / Name ↓ / Date ↑ …" would make choosing a field cost up to two
 * clicks and hide the current direction behind the label.
 *
 * THE DOT IS ON WHENEVER THE ORDER IS NOT THE DEFAULT, which is a different
 * question from the filter menu's dot. Sorting hides nothing — no row leaves
 * the list — so an unexpected order is a much quieter surprise than an
 * unexpected absence; the pip is there so it is not a silent one.
 *
 * The direction labels are the FIELD's words, not "asc" and "desc": "Oldest
 * first" says what a date sort does and "A to Z" says what a name sort does,
 * where "ascending" says neither to anyone who is not thinking about
 * comparators.
 */
const PANEL_HEIGHT = 356;

/** Time fields read as first/last, text and rank fields as low/high. */
const CHRONOLOGICAL = new Set(["updated", "created", "start", "end"]);

export function ProjectsSortMenu({
  workspaceId,
  view,
  filters,
}: {
  workspaceId: string;
  view: ProjectView;
  filters: ProjectFilters;
}) {
  const go = useFilterNav({ workspaceId, view, filters });
  const { sort, direction } = filters;
  const chronological = CHRONOLOGICAL.has(sort);

  const changed = sort !== DEFAULT_SORT || direction !== NATURAL_DIRECTION[sort];

  return (
    <ToolbarMenu
      icon={<SortIcon className="size-3.5" />}
      label={`Sort projects, currently ${PROJECT_SORT_LABEL[sort].toLowerCase()}`}
      closeOnSelect
      panelLabel="Sort projects"
      height={PANEL_HEIGHT}
      dot={changed}
    >
      <>
        <MenuHeading>Sort by</MenuHeading>
        {PROJECT_SORTS.map((option) => (
          <MenuChoice
            key={option}
            label={PROJECT_SORT_LABEL[option]}
            selected={sort === option}
            onSelect={() => go({ sort: option, direction: NATURAL_DIRECTION[option] })}
          />
        ))}

        <MenuHeading>Direction</MenuHeading>
        <MenuChoice
          label={chronological ? "Newest first" : "Z to A"}
          selected={direction === "desc"}
          onSelect={() => go({ direction: "desc" })}
        />
        <MenuChoice
          label={chronological ? "Oldest first" : "A to Z"}
          selected={direction === "asc"}
          onSelect={() => go({ direction: "asc" })}
        />
      </>
    </ToolbarMenu>
  );
}
