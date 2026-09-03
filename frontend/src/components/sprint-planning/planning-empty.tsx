/**
 * The empty state both panels use. One component rather than two, because the
 * box is identical and only the sentences differ — an empty backlog, a backlog
 * filtered down to nothing, and a sprint nobody has planned into are three
 * different things to say inside the same frame.
 *
 * Dashed, on `surface-sunken`: the same treatment `SprintsEmpty` and the board's
 * drop zones use for "this container is a place something goes".
 */
export function PlanningEmpty({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div className="mt-2 rounded-md border border-dashed border-border bg-surface-sunken px-4 py-8 text-center">
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mx-auto mt-1 max-w-prose text-xs text-text-subtle">{hint}</p>
    </div>
  );
}
