import { weekTicks, type TimelineWindow } from "@/lib/timeline";

/*
 * Month headers with week tick marks, and the Today flag above the line.
 *
 * `style` carries every horizontal position in this file, and that is the
 * sanctioned exception: a month's share of the track and a tick's offset are
 * computed percentages, and `w-[27.4%]` built by interpolation is a class
 * Tailwind never emitted. Colour, radius and type stay utilities throughout.
 *
 * `w-52` matches the label gutter on every row below, which is what keeps the
 * scale and the bars on the same x-axis.
 */
export function TimelineScale({ window }: { window: TimelineWindow }) {
  return (
    <div className="flex items-end border-b border-border">
      <div className="w-52 shrink-0" />

      <div className="relative flex-1">
        <div className="flex">
          {window.months.map((month) => (
            <div
              key={month.key}
              style={{ width: `${(month.days / window.totalDays) * 100}%` }}
              className="border-l border-border px-2 pt-1 pb-2 text-2xs font-medium whitespace-nowrap text-text-muted"
            >
              {month.label}
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {weekTicks(window).map((percent) => (
            <span
              key={percent}
              style={{ left: `${percent}%` }}
              className="absolute bottom-0 h-1.5 w-px bg-border"
            />
          ))}
        </div>

        {/* The brand moment on this screen. `on-brand` on `brand-500` is
            7.1:1 in both themes — never white. */}
        <span
          style={{ left: `${window.todayPercent}%` }}
          className="absolute -top-0.5 -translate-x-1/2 rounded-xs bg-brand-500 px-1.5 py-0.5 text-2xs font-semibold whitespace-nowrap text-on-brand"
        >
          Today
        </span>
      </div>
    </div>
  );
}
