import { ColumnPill } from "@/components/board/column-pill";
import { cn } from "@/lib/cn";
import type { ListTone } from "@/types/board";

/**
 * One list column — the shell both boards share: the status pill, the count,
 * the track its cards sit in, and whatever composer belongs at the bottom.
 *
 * Notion leaves the track itself untinted, so the colour lives in the pill and
 * there is no column fill. The one exception is `isOver`: while a card is being
 * dragged over this column the track fills and its edge goes dashed, which is
 * the drop indicator.
 *
 * It holds no state and no hooks, so it stays a Server Component on the backlog
 * board. The sprint board imports it from a client file, where it compiles as
 * part of that bundle and `containerRef` carries dnd-kit's droppable node.
 */
const TRACK =
  "flex min-h-16 flex-col rounded-md border p-1 transition-colors duration-100 ease-standard";

/* Two complete strings, picked between — never layered. `cn` is a plain join,
   so `border-transparent` and `border-focus` in one class list would leave the
   stylesheet's own order to decide, and the transparent one wins. */
const IDLE = "border-transparent";
const OVER = "border-dashed border-focus bg-surface-hover";

export function BoardColumn({
  listId,
  title,
  tone,
  count,
  emptyLabel = "Nothing here yet",
  isOver = false,
  containerRef,
  footer,
  children,
}: {
  listId: string;
  title: string;
  tone?: ListTone;
  /** Rendered beside the pill, and what decides the empty state. */
  count: number;
  emptyLabel?: string;
  /** A card is being dragged over this column. */
  isOver?: boolean;
  /** dnd-kit's droppable node, on the boards that have one. */
  containerRef?: React.Ref<HTMLDivElement>;
  /** The composer pinned under the track. */
  footer?: React.ReactNode;
  /** The cards, as `<li>`s. */
  children?: React.ReactNode;
}) {
  const headingId = `list-${listId}`;

  return (
    <section
      aria-labelledby={headingId}
      /* `relative` is load-bearing, not decoration. An absolutely positioned
         descendant with no positioned ancestor resolves against the page, which
         means the column rail's `overflow-x` does not clip it — and a `sr-only`
         span sitting 600px along a scrolled rail then gives the PAGE a
         horizontal scrollbar at 360px. Making the column the containing block
         keeps every one of them inside the rail. */
      className="relative flex max-h-full w-list shrink-0 flex-col"
    >
      <header className="flex items-center gap-2 px-1 pb-2">
        <ColumnPill id={headingId} title={title} tone={tone} />
        <span className="text-2xs tabular-nums text-text-subtle">
          {count}
          <span className="sr-only"> cards</span>
        </span>
      </header>

      <div ref={containerRef} className={cn(TRACK, isOver ? OVER : IDLE)}>
        {count > 0 ? (
          <ul className="scrollbar-board space-y-1.5 overflow-y-auto">
            {children}
          </ul>
        ) : (
          <p className="rounded-sm border border-dashed border-border px-2 py-4 text-center text-2xs text-text-subtle">
            {emptyLabel}
          </p>
        )}
      </div>

      {footer}
    </section>
  );
}
