/*
 * The shell all three profile columns share.
 *
 * It exists because "the boxes are the same height" is not something three
 * separately-written `<section>`s can be trusted to keep. `h-full` on a grid
 * item is what makes it fill the row's height — the row is already as tall as
 * the tallest column, so without it a short card stops at its content and the
 * three read as ragged. One place owns that, and the padding, and the heading
 * treatment, so a fourth column added later cannot drift.
 *
 * `flex flex-col` so a child can take `flex-1` and push its own footer down —
 * which is how the form's Save row sits on the card's bottom edge rather than
 * floating under the last field.
 */
export function ProfileCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-surface p-6">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        {title}
      </h2>

      {hint && <p className="mt-1 text-2xs text-text-subtle">{hint}</p>}

      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}
