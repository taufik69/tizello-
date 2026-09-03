"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { SearchIcon } from "@/components/ui/nav-icons";
import { FilterIcon } from "@/components/ui/table-icons";
import { plural } from "@/lib/plural";

/*
 * The count on the left, "New sprint" on the right.
 *
 * Filter and search are `LockedControl`s rather than `<button>`s with no
 * handler — the same call `BacklogToolbar` and `ProjectsToolbar` make: the
 * reason travels as a tooltip, as the tail of the accessible name and as the
 * dim, and inertness is the contract rather than something the next caller has
 * to remember. Only "New sprint" does anything.
 *
 * The strip wraps rather than scrolls: at 360px the count takes the first line
 * and the controls drop below it.
 */
const ICON = "size-7 rounded-sm text-text-muted";

export function SprintsToolbar({
  count,
  activeName,
  onNewSprint,
}: {
  count: number;
  /** The running sprint's name, when there is one. */
  activeName?: string;
  onNewSprint: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
      <p className="text-xs text-text-subtle">
        <span className="font-semibold text-text">
          {plural(count, "sprint", "sprints")}
        </span>
        {activeName ? (
          <> &middot; {activeName} is running</>
        ) : (
          count > 0 && <> &middot; none active</>
        )}
      </p>

      <div className="flex shrink-0 items-center gap-0.5">
        <LockedControl
          reason="Filtering is not built yet"
          label="Filter sprints"
          className={ICON}
        >
          <FilterIcon className="size-3.5" />
        </LockedControl>

        <LockedControl
          reason="Search is not built yet"
          label="Search sprints"
          className={ICON}
        >
          <SearchIcon className="size-3.5" />
        </LockedControl>

        <Button size="sm" onClick={onNewSprint} className="ml-1">
          <PlusIcon className="size-3.5" />
          New sprint
        </Button>
      </div>
    </div>
  );
}
