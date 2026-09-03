"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "@/components/ui/icons";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { plural } from "@/lib/plural";
import type { SprintRecord } from "@/types/sprint";

/*
 * Which sprint you are filling. Only PLANNING sprints are offered: the running
 * one is being worked and a closed one is history, so neither is a thing to
 * plan into — see `.claude/rules/workflow.md`.
 *
 * The repo's hand-rolled `DropdownMenu` rather than a native `<select>`: each
 * option carries three lines (name, window, what is already in it), and an
 * `<option>` is one string of text. `TaskAssigneeChoice` keeps the native
 * control for the case where one line is genuinely all there is.
 *
 * The trigger TRUNCATES. Sprint 15's name is eighty characters, and a selector
 * that grows to fit it pushes the capacity meter and "Start sprint" off a
 * 360px screen.
 */
const TRIGGER = "h-auto max-w-full gap-2 py-1.5 text-left";

function range(sprint: SprintRecord): string {
  return `${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`;
}

export function SprintSelect({
  sprints,
  selected,
  onSelect,
}: {
  /** The sprints that can be planned into, soonest first. */
  sprints: SprintRecord[];
  selected: SprintRecord;
  onSelect: (sprintId: string) => void;
}) {
  return (
    <DropdownMenu className="min-w-0">
      <DropdownMenuTrigger
        aria-label={`Planning ${selected.name}. Choose a different sprint`}
        className={buttonVariants({ variant: "outline", className: TRIGGER })}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text">
            {selected.name}
          </span>
          <span className="block truncate text-2xs font-normal text-text-subtle">
            {range(selected)}
          </span>
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-text-subtle" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-w-[min(20rem,calc(100vw-2rem))]">
        <DropdownMenuLabel>Sprints in planning</DropdownMenuLabel>

        {sprints.map((sprint) => (
          <DropdownMenuItem
            key={sprint.id}
            onSelect={() => onSelect(sprint.id)}
            aria-current={sprint.id === selected.id ? "true" : undefined}
          >
            {/* One child, not two: `DropdownMenuItem` sets `items-center` and
                `gap-2` on its row, and `cn` is a plain join — a second column
                would have to fight classes the base owns. */}
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-text">
                {sprint.name}
              </span>
              <span className="block text-2xs font-normal text-text-subtle">
                {range(sprint)}
                {sprint.capacityPoints !== undefined && (
                  <> &middot; {plural(sprint.capacityPoints, "pt", "pts")} capacity</>
                )}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
