"use client";

import { BoardProgress } from "@/components/sprint-board/board-progress";
import { Button } from "@/components/ui/button";
import { FlagIcon, PlusIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { SearchIcon } from "@/components/ui/nav-icons";
import { FilterIcon, SortIcon } from "@/components/ui/table-icons";
import type { SprintState } from "@/types/sprint";
import type { BoardTotals } from "@/types/sprint-board";

/*
 * The live numbers on the left, the controls on the right.
 *
 * Filter, sort and search are `LockedControl`s rather than `<button>`s with no
 * handler — the same call `BacklogToolbar` and `ProjectsToolbar` make: the
 * reason travels as a tooltip, as the tail of the accessible name and as the
 * dim, and inertness is the contract rather than something the next caller has
 * to remember. Hiding cards from a board that is dragged is not a filter, it is
 * a second ordering model, so it is left undone rather than half done.
 *
 * "Add task" and "Complete sprint" are the two real controls. The strip wraps
 * rather than scrolls: at 360px the numbers take the first line and the
 * controls drop below them.
 */
const ICON = "size-7 rounded-sm text-text-muted";

export function BoardToolbar({
  totals,
  state,
  onAddTask,
  onCompleteSprint,
}: {
  totals: BoardTotals;
  state: SprintState;
  onAddTask: () => void;
  onCompleteSprint: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
      <BoardProgress totals={totals} state={state} />

      <div className="flex shrink-0 items-center gap-0.5">
        <LockedControl
          reason="Filtering the board is not built yet"
          label="Filter cards"
          className={ICON}
        >
          <FilterIcon className="size-3.5" />
        </LockedControl>

        <LockedControl
          reason="Sorting is not built yet — drag a card to rank it"
          label="Sort cards"
          className={ICON}
        >
          <SortIcon className="size-3.5" />
        </LockedControl>

        <LockedControl
          reason="Search is not built yet"
          label="Search cards"
          className={ICON}
        >
          <SearchIcon className="size-3.5" />
        </LockedControl>

        <Button
          size="sm"
          variant="outline"
          onClick={onCompleteSprint}
          className="ml-1"
        >
          <FlagIcon className="size-3.5" />
          Complete sprint
        </Button>

        <Button size="sm" onClick={onAddTask} className="ml-1">
          <PlusIcon className="size-3.5" />
          Add task
        </Button>
      </div>
    </div>
  );
}
