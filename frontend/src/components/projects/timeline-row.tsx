import { DateRange } from "@/components/projects/date-range";
import { STATUS_BAR } from "@/components/projects/project-tone";
import { cn } from "@/lib/cn";
import { barPlacement, type TimelineWindow } from "@/lib/timeline";
import type { ProjectRecord } from "@/types/project";

/*
 * The name in a fixed gutter, the bar on the shared track.
 *
 * The bar is `aria-hidden`: its offset and width are the visual encoding of
 * dates that this row already states as real text, so announcing it twice
 * would only add noise. `sr-only` on the range keeps it out of the gutter's
 * width while leaving it in the accessibility tree.
 *
 * `left` and `width` are `style` because they are computed percentages — the
 * one dynamic-value exception the house rules allow. Everything else is a
 * utility.
 */
const CORNERS = {
  whole: "rounded-xs",
  openStart: "rounded-r-xs",
  openEnd: "rounded-l-xs",
  openBoth: "",
} as const;

function corners(clippedStart: boolean, clippedEnd: boolean) {
  if (clippedStart && clippedEnd) return CORNERS.openBoth;
  if (clippedStart) return CORNERS.openStart;
  if (clippedEnd) return CORNERS.openEnd;
  return CORNERS.whole;
}

export function TimelineRow({
  project,
  window,
}: {
  project: ProjectRecord;
  window: TimelineWindow;
}) {
  const placement = barPlacement(project, window);

  return (
    <li className="flex items-center">
      <div className="w-52 shrink-0 truncate pr-3 pl-0.5 text-xs text-text-muted">
        {project.name}
      </div>

      <div className="relative h-9 flex-1">
        {placement ? (
          <>
            {/* The bar is the visual encoding of dates the row would
                otherwise not state, so the range travels as text here and the
                bar itself is hidden. When there IS no bar the fallback below
                says so once, visibly — saying it twice is what the first pass
                did. */}
            <span className="sr-only">
              <DateRange project={project} />
            </span>
            <span
              aria-hidden="true"
              style={{
                left: `${placement.leftPercent}%`,
                width: `${placement.widthPercent}%`,
              }}
              className={cn(
                "absolute top-2 block h-5 border",
                STATUS_BAR[project.status],
                corners(placement.clippedStart, placement.clippedEnd),
              )}
            />
          </>
        ) : (
          <span className="absolute top-2 left-2 text-2xs text-text-subtle italic">
            Not scheduled
          </span>
        )}
      </div>
    </li>
  );
}
