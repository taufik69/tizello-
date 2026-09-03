import { notFound, redirect } from "next/navigation";
import { BoardColumn } from "@/components/board/board-column";
import { BoardHeader } from "@/components/board/board-header";
import { getSession } from "@/lib/auth";
import { getBoard } from "@/lib/boards";

export async function generateMetadata({ params }: PageProps<"/board/[boardId]">) {
  const { boardId } = await params;
  const board = await getBoard(boardId);

  if (!board) return { title: "Board not found" };
  return {
    title: board.title,
    description: `${board.lists.length} lists on the ${board.title} board.`,
  };
}

/**
 * The board. A Server Component: data is awaited here, and the only JavaScript
 * shipped by the page itself is the card composer, a client leaf imported from
 * a server-rendered parent. The shell comes from `board/layout.tsx`.
 *
 * `h-full` fills the shell's content column exactly, which is what keeps the
 * list rail's horizontal scroll on the rail rather than on the page. The track
 * is `surface-sunken` so the flat, `bg-surface` cards still read as cards — the
 * content column behind it is `bg-surface` too, and `bg-canvas` is now the
 * sidebar's colour.
 */
export default async function BoardPage({ params }: PageProps<"/board/[boardId]">) {
  const { boardId } = await params;

  /*
   * The proxy only checks that a session cookie EXISTS — that is an optimistic
   * check, cheap enough to run on every request. This is where the cookie is
   * actually resolved to a user, and a cookie that resolves to nobody is
   * treated exactly like no cookie at all.
   */
  if (!(await getSession())) redirect(`/sign-in?next=/board/${boardId}`);

  const board = await getBoard(boardId);
  if (!board) notFound();

  return (
    <main className="flex h-full flex-col bg-surface-sunken">
      <BoardHeader board={board} />

      <div className="scrollbar-board flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-4 pb-4">
        {board.lists.map((list) => (
          <BoardColumn key={list.id} list={list} boardId={board.id} />
        ))}
      </div>
    </main>
  );
}
