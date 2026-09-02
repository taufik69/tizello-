"use server";

import { revalidatePath } from "next/cache";
import { closeSprint, planIntoSprint } from "@/lib/sprint";

export type SprintActionState = { error?: string; message?: string };

/** Sprint planning: move the chosen backlog cards into the sprint's To do. */
export async function planIntoSprintAction(
  _previous: SprintActionState,
  formData: FormData,
): Promise<SprintActionState> {
  const sprintId = String(formData.get("sprintId") ?? "");
  const cardIds = formData.getAll("cardId").map(String).filter(Boolean);

  if (!sprintId) return { error: "Missing sprint." };
  if (cardIds.length === 0) return { error: "Pick at least one task." };

  const moved = await planIntoSprint(sprintId, cardIds);
  if (moved === 0) return { error: "Nothing moved. Try again." };

  revalidatePath("/board/backlog");
  revalidatePath(`/board/${sprintId}`);
  return { message: `${moved} task${moved === 1 ? "" : "s"} added to the sprint.` };
}

/** Sprint close: Done is the record, everything else returns to the backlog. */
export async function closeSprintAction(
  _previous: SprintActionState,
  formData: FormData,
): Promise<SprintActionState> {
  const sprintId = String(formData.get("sprintId") ?? "");
  if (!sprintId) return { error: "Missing sprint." };

  const result = await closeSprint(sprintId);
  if (!result) return { error: "That sprint no longer exists." };

  revalidatePath("/board/backlog");
  revalidatePath(`/board/${sprintId}`);
  return {
    message: `${result.completed} completed, ${result.returned} returned to the backlog.`,
  };
}
