import { STATUS_ARC } from "@/components/projects/project-tone";
import type { StatusSlice } from "@/lib/status-breakdown";

/*
 * Inline SVG, no chart library. Each slice is one `<circle>` carrying a
 * `stroke-dasharray` of "arc length, then the rest of the ring" and a negative
 * `stroke-dashoffset` that walks it round.
 *
 * `dasharray` and `dashoffset` are SVG PRESENTATION ATTRIBUTES, not inline
 * styles — the numbers are geometry, and the only reason they are not
 * utilities is that no utility could express them.
 *
 * Colour comes from `STATUS_ARC`, a lookup of complete class strings.
 * `` `stroke-${status}` `` would compile to nothing: Tailwind scans source as
 * plain text and has no idea what `status` holds.
 *
 * `role="img"` plus one `aria-label` sentence, because a ring of arcs is
 * unreadable otherwise — and the legend beside it repeats every number as real
 * text, so the chart is never the sole carrier of the data.
 */
const RADIUS = 45;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function StatusDonut({
  slices,
  total,
  label,
}: {
  slices: StatusSlice[];
  total: number;
  label: string;
}) {
  return (
    <div className="relative size-40 shrink-0">
      <svg viewBox="0 0 120 120" role="img" aria-label={label} className="size-40">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="14"
          className="stroke-border"
        />
        {/* -90deg so the first arc starts at twelve o'clock, not three. */}
        <g transform="rotate(-90 60 60)">
          {slices
            .filter((slice) => slice.count > 0)
            .map((slice) => {
              const length = (slice.count / total) * CIRCUMFERENCE;
              return (
                <circle
                  key={slice.status}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="14"
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-(slice.startPercent / 100) * CIRCUMFERENCE}
                  className={STATUS_ARC[slice.status]}
                />
              );
            })}
        </g>
      </svg>

      {/* The centre total is decoration: the same number is a real heading in
          the panel above, so it is hidden from the accessibility tree rather
          than read out a second time. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="text-xl font-semibold tabular-nums text-text">
          {total}
        </span>
        <span className="text-2xs text-text-subtle">projects</span>
      </div>
    </div>
  );
}
