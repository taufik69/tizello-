import { StatusDot } from "@/components/projects/status-dot";
import { STATUS_LABEL } from "@/lib/project-groups";
import type { StatusSlice } from "@/lib/status-breakdown";

/*
 * The legend is the data. Every count and percentage here is real text, which
 * is what lets the ring beside it be a single `role="img"` — and what makes
 * the screen usable for anyone who cannot separate its six hues.
 *
 * Zero rows are kept. "To-do 0 · 0%" is information; silently omitting the
 * status makes the list look like the status does not exist.
 *
 * Percentages are each rounded on their own, so equal counts always read as
 * equal percentages — see the note in `status-breakdown.ts` for why that beats
 * a column that totals exactly 100.
 */
export function StatusLegend({ slices }: { slices: StatusSlice[] }) {
  return (
    <ul className="w-full max-w-sm">
      {slices.map((slice) => (
        <li
          key={slice.status}
          className="flex items-center gap-2 border-b border-border py-2 last:border-b-0"
        >
          <StatusDot status={slice.status} />
          <span className="min-w-0 flex-1 truncate text-xs text-text">
            {STATUS_LABEL[slice.status]}
          </span>
          <span className="w-8 text-right text-xs tabular-nums text-text-muted">
            {slice.count}
          </span>
          <span className="w-10 text-right text-xs tabular-nums text-text-subtle">
            {slice.percent}%
          </span>
        </li>
      ))}
    </ul>
  );
}
