import { weekTicks, type TimelineWindow } from "@/lib/timeline";

/*
 * The week gridlines and the Today rule, drawn ONCE behind every group rather
 * than per row — sixteen ticks times six rows is ninety-six nodes for
 * something that is one background.
 *
 * `left-52` is the label gutter, matching `w-52` on the scale and on each row.
 * Purely decorative: the dates are real text in every row, so this is
 * `aria-hidden` and takes no pointer events.
 */
export function TimelineGrid({ window }: { window: TimelineWindow }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 left-52"
    >
      {weekTicks(window).map((percent) => (
        <span
          key={percent}
          style={{ left: `${percent}%` }}
          className="absolute inset-y-0 w-px bg-border"
        />
      ))}

      {/* `text-subtle` is 3.68:1 on surface — a rule you can see without it
          competing with the bars it crosses. */}
      <span
        style={{ left: `${window.todayPercent}%` }}
        className="absolute inset-y-0 w-0.5 bg-text-subtle"
      />
    </div>
  );
}
