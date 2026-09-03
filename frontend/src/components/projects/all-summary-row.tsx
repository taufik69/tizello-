/*
 * The footer roll-up: how many of the rows above are finished.
 *
 * The bar's width is the one thing on this screen that genuinely cannot be a
 * utility class — it is a percentage computed from the data, and building
 * `w-[33%]` by interpolation would produce a class Tailwind never emitted.
 * This is the sanctioned `style={{}}` exception — the only one on the All
 * view. The timeline draws its own (bar offsets, month widths, tick and
 * today rules); every one of them is a computed percentage for the same
 * reason.
 *
 * The numbers are real text either side of it, so the bar is decoration and
 * `aria-hidden`; nothing is carried by the fill alone.
 */
export function AllSummaryRow({
  complete,
  total,
}: {
  complete: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : (complete / total) * 100;

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <span className="text-2xs font-semibold tracking-widest text-text-subtle uppercase">
        Complete
      </span>
      <span
        aria-hidden="true"
        className="h-1 w-24 overflow-hidden rounded-xs bg-surface-sunken"
      >
        <span
          className="block h-full rounded-xs bg-success"
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="text-2xs tabular-nums text-text-muted">
        {complete}/{total}
      </span>
    </div>
  );
}
