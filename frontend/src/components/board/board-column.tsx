import { AddCardForm } from "@/components/board/add-card-form";
import { CardTile } from "@/components/board/card-tile";
import type { BoardList } from "@/types/board";

/**
 * One list column. Server Component — the composer inside it is the client
 * leaf, so the column, its header and every card render on the server.
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
      className="flex max-h-full w-list shrink-0 flex-col rounded-lg bg-canvas p-2"
    >
      <header className="flex items-center justify-between gap-2 px-2 py-1.5">
        <h2 id={`list-${list.id}`} className="text-sm font-semibold text-text">
          {list.title}
        </h2>
        <span className="text-2xs text-text-subtle">
          {list.cards.length}
          <span className="sr-only"> cards</span>
        </span>
      </header>

      {list.cards.length > 0 ? (
        <ul className="scrollbar-board space-y-2 overflow-y-auto pt-1">
          {list.cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed border-border px-2 py-4 text-center text-2xs text-text-subtle">
          Nothing here yet
        </p>
      )}

      <AddCardForm boardId={boardId} listId={list.id} listTitle={list.title} />
    </section>
  );
}
