import { MemberAvatars } from "@/components/board/member-avatars";
import type { Board } from "@/types/board";

export function BoardHeader({ board }: { board: Board }) {
  const cardCount = board.lists.reduce(
    (total, list) => total + list.cards.length,
    0,
  );

  const members = Array.from(
    new Map(
      board.lists
        .flatMap((list) => list.cards)
        .flatMap((card) => card.members)
        .map((member) => [member.id, member]),
    ).values(),
  );

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold text-on-board">{board.title}</h1>
        <p className="text-2xs text-on-board/75">
          {board.lists.length} lists · {cardCount} cards
        </p>
      </div>
      <MemberAvatars members={members} />
    </header>
  );
}
