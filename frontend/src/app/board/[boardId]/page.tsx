import { notFound, redirect } from "next/navigation";
import { BoardColumn } from "@/components/board/board-column";
import { BoardHeader } from "@/components/board/board-header";
import { TopBar } from "@/components/layout/top-bar";
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
 * shipped for this route is the card composer and the theme toggle — both
 * client leaves imported from server-rendered parents.
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
    <div className="flex h-dvh flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1 flex-col bg-canvas">
        <BoardHeader board={board} />

        <div className="scrollbar-board flex min-h-0 flex-1 items-start gap-4 overflow-x-auto px-4 pb-4">
          {board.lists.map((list) => (
            <BoardColumn key={list.id} list={list} boardId={board.id} />
          ))}
        </div>
      </div>
    </div>
  );
}
