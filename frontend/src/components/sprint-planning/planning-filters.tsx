"use client";

import { useId } from "react";
import { SearchIcon } from "@/components/ui/nav-icons";
import { cn } from "@/lib/cn";
import { PROJECT_PRIORITIES } from "@/types/project";
import { PRIORITY_LABEL } from "@/lib/project-groups";
import {
  PLANNING_SORTS,
  type PlanningFilters as Filters,
  type PlanningSort,
} from "@/lib/sprint-planning";

/*
 * Search, filter and sort for the backlog side — and all three WORK. They are
 * plain client state over a list this screen already holds, which is why they
 * are real controls here and `LockedControl`s on the backlog screen, where the
 * same three would have to reach a server that does not exist.
 *
 * Two native `<select>`s rather than custom listboxes: four options each, and
 * the platform already ships the keyboard, the type-ahead and the mobile
 * picker. `TaskAssigneeChoice` makes the same call.
 *
 * Every control is labelled; the labels are `sr-only` because the strip is
 * dense and each control states its own value. It wraps at 360px, where the
 * search field takes a line of its own.
 */
const FIELD =
  "h-8 rounded-sm border border-border bg-surface text-xs text-text transition-colors duration-100 ease-standard";

const SORT_LABEL: Record<PlanningSort, string> = {
  PRIORITY: "Sort: priority",
  POINTS: "Sort: largest estimate",
  FILED: "Sort: order filed",
};

export function PlanningFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  const searchId = useId();
  const priorityId = useId();
  const sortId = useId();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <div className="relative min-w-40 flex-1">
        <label htmlFor={searchId} className="sr-only">
          Search the backlog by title or id
        </label>
        <SearchIcon className="pointer-events-none absolute top-2 left-2 size-3.5 text-text-subtle" />
        <input
          id={searchId}
          type="search"
          value={filters.query}
          placeholder="Search backlog"
          onChange={(event) =>
            onChange({ ...filters, query: event.target.value })
          }
          className={cn(FIELD, "w-full pl-7 placeholder:text-text-subtle")}
        />
      </div>

      <label htmlFor={priorityId} className="sr-only">
        Filter the backlog by priority
      </label>
      <select
        id={priorityId}
        value={filters.priority}
        onChange={(event) =>
          onChange({
            ...filters,
            priority: event.target.value as Filters["priority"],
          })
        }
        className={cn(FIELD, "px-1.5")}
      >
        <option value="ALL">All priorities</option>
        {PROJECT_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {PRIORITY_LABEL[priority]}
          </option>
        ))}
      </select>

      <label htmlFor={sortId} className="sr-only">
        Sort the backlog
      </label>
      <select
        id={sortId}
        value={filters.sort}
        onChange={(event) =>
          onChange({ ...filters, sort: event.target.value as PlanningSort })
        }
        className={cn(FIELD, "px-1.5")}
      >
        {PLANNING_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {SORT_LABEL[sort]}
          </option>
        ))}
      </select>
    </div>
  );
}
