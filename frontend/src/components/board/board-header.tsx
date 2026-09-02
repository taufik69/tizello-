import { MemberAvatars } from "@/components/board/member-avatars";
import { isSprintBoard, type Board } from "@/types/board";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

function summarise(board: Board) {
  const cardCount = board.lists.reduce((n, list) => n + list.cards.length, 0);

  if (!isSprintBoard(board)) {
    return `${cardCount} tasks waiting to be planned`;
  }

  const { startsOn, endsOn, closedOn } = board.sprint;
  const done =
    board.lists.find((list) => list.status === "done")?.cards.length ?? 0;
  const window = `${dateFormat.format(new Date(startsOn))} – ${dateFormat.format(new Date(endsOn))}`;

  return `${window} · ${done}/${cardCount} done${closedOn ? " · closed" : ""}`;
}

export function BoardHeader({ board }: { board: Board }) {
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
        <h1 className="text-lg font-semibold text-text">{board.title}</h1>
        <p className="text-2xs text-text-subtle">{summarise(board)}</p>
      </div>
      <MemberAvatars members={members} />
    </header>
  );
}
