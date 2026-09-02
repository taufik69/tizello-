import { AddCardForm } from "@/components/board/add-card-form";
import { CardTile } from "@/components/board/card-tile";
import { ColumnPill } from "@/components/board/column-pill";
import type { BoardList } from "@/types/board";

/**
 * One list column. Notion leaves the track itself untinted — the colour lives
 * in the status pill — so there is no column fill here.
 *
 * Server Component; the composer inside it is the client leaf.
 */
export function BoardColumn({
  list,
  boardId,
}: {
  list: BoardList;
  boardId: string;
}) {
  return (
    <section
      aria-labelledby={`list-${list.id}`}
      className="flex max-h-full w-list shrink-0 flex-col"
    >
      <header className="flex items-center gap-2 px-1 pb-2">
        <ColumnPill id={`list-${list.id}`} title={list.title} tone={list.tone} />
        <span className="text-2xs text-text-subtle">
          {list.cards.length}
          <span className="sr-only"> cards</span>
        </span>
      </header>

      {list.cards.length > 0 ? (
        <ul className="scrollbar-board space-y-1.5 overflow-y-auto">
          {list.cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </ul>
      ) : (
        <p className="rounded-sm border border-dashed border-border px-2 py-4 text-center text-2xs text-text-subtle">
          Nothing here yet
        </p>
      )}

      <AddCardForm boardId={boardId} listId={list.id} listTitle={list.title} />
    </section>
  );
}
