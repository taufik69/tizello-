"use client";

import { PriorityDot } from "@/components/backlog/priority-dot";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { PRIORITY_LABEL } from "@/lib/project-groups";
import type { ProjectPriority } from "@/types/project";

/*
 * A collapsible group heading: the chevron, a priority dot, the label, the
 * count and the group's estimate.
 *
 * Unlike `StatusGroupHeader` — where collapsing is not built and the chevron is
 * therefore inert decoration — this one IS a control, so it is a real
 * `<button>` carrying `aria-expanded` and `aria-controls`. The chevron rotates
 * rather than swapping glyphs, which keeps the two states one element.
 *
 * The row stays `bg-surface`: `PriorityDot`'s red is judged on `surface`, and
 * tinting the header would drop it below the 3:1 an indicator needs.
 */
const HEADER =
  "flex w-full items-center gap-1.5 rounded-sm bg-surface px-1 py-1.5 text-left transition-colors duration-100 ease-standard hover:bg-surface-hover";

export function BacklogGroupHeader({
  priority,
  count,
  points,
  collapsed,
  panelId,
  onToggle,
}: {
  priority: ProjectPriority;
  count: number;
  points: number;
  collapsed: boolean;
  /** The list this header shows and hides. */
  panelId: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-controls={panelId}
      className={HEADER}
    >
      <ChevronDownIcon
        className={cn(
          "size-3.5 shrink-0 text-text-subtle transition-transform duration-100 ease-standard",
          collapsed && "-rotate-90",
        )}
      />
      <PriorityDot priority={priority} />
      <span className="text-xs font-semibold text-text">
        {PRIORITY_LABEL[priority]}
      </span>
      <span className="text-2xs tabular-nums text-text-subtle">{count}</span>

      {points > 0 && (
        <span className="ml-auto text-2xs tabular-nums text-text-subtle">
          {points} pts
        </span>
      )}
    </button>
  );
}
