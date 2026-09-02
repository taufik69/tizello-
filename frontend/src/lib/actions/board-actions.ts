"use server";

import { revalidatePath } from "next/cache";
import { addCard } from "@/lib/boards";

export type CreateCardState = { error?: string };

const MAX_TITLE = 200;

/**
 * Server Action behind the card composer. Every field is re-validated here:
 * the client-side `required` attribute is a convenience, not a control.
 */
export async function createCardAction(
  _previous: CreateCardState,
  formData: FormData,
): Promise<CreateCardState> {
  const boardId = String(formData.get("boardId") ?? "");
  const listId = String(formData.get("listId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  if (!boardId || !listId) return { error: "Missing board or list." };
  if (!title) return { error: "Give the card a title." };
  if (title.length > MAX_TITLE) {
    return { error: `Keep the title under ${MAX_TITLE} characters.` };
  }

  const created = await addCard(boardId, listId, title);
  if (!created) return { error: "That list no longer exists." };

  revalidatePath(`/board/${boardId}`);
  return {};
}
