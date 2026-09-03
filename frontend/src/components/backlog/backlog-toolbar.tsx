"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { SearchIcon } from "@/components/ui/nav-icons";
import { FilterIcon, SortIcon } from "@/components/ui/table-icons";
import { plural } from "@/lib/plural";

/*
 * The count on the left, the controls on the right.
 *
 * Filter, sort and search are `LockedControl`s rather than `<button>`s with no
 * handler — the same call `ProjectsToolbar` makes: the reason travels as a
 * tooltip, as the tail of the accessible name and as the dim, and inertness is
 * the contract rather than something the next caller has to remember. Only
 * "New task" does anything, and it is the one real `Button` here.
 *
 * The strip wraps rather than scrolls: at 360px the count takes the first line
 * and the controls drop below it.
 */
const ICON = "size-7 rounded-sm text-text-muted";

export function BacklogToolbar({
  count,
  points,
  onNewTask,
}: {
  count: number;
  /** Estimated points across the whole backlog. */
  points: number;
  onNewTask: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
      <p className="text-xs text-text-subtle">
        <span className="font-semibold text-text">
          {plural(count, "item", "items")}
        </span>
        {points > 0 && <> &middot; {points} pts estimated</>}
      </p>

      <div className="flex shrink-0 items-center gap-0.5">
        <LockedControl
          reason="Filtering is not built yet"
          label="Filter backlog"
          className={ICON}
        >
          <FilterIcon className="size-3.5" />
        </LockedControl>

        <LockedControl
          reason="Sorting is not built yet"
          label="Sort backlog"
          className={ICON}
        >
          <SortIcon className="size-3.5" />
        </LockedControl>

        <LockedControl
          reason="Search is not built yet"
          label="Search backlog"
          className={ICON}
        >
          <SearchIcon className="size-3.5" />
        </LockedControl>

        <Button size="sm" onClick={onNewTask} className="ml-1">
          <PlusIcon className="size-3.5" />
          New task
        </Button>
      </div>
    </div>
  );
}
