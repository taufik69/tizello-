"use server";

import { revalidatePath } from "next/cache";
import { createWorkspace } from "@/lib/workspaces";
import type { WorkspaceFormState } from "@/types/workspace";

/*
 * Every workspace write. Thin by rule: validate, call a plain function from
 * `lib/workspaces.ts`, revalidate. The rules themselves live on the server —
 * see `backend/docs/api/workspace.md`.
 *
 * Plain arguments, not `(prevState, formData)` — this is called from a
 * `useTransition` event handler (`create-workspace-dialog.tsx`), the same
 * shape as `inviteMemberAction`, not from a `<form action>`. That is what
 * lets the dialog branch on the result and close itself synchronously in the
 * handler instead of watching for success in a `useEffect`, which would trip
 * `react-hooks/set-state-in-effect` the moment it called the parent's
 * `onOpenChange`.
 */

const NAME_MIN = 2;
const NAME_MAX = 80;

/** `POST /workspaces`. Re-validates `name`'s length even though the dialog's `TextField` already does — the client-side rule is a convenience, this is the control. */
export async function createWorkspaceAction(input: {
  name: string;
  icon?: string;
  color?: string;
}): Promise<WorkspaceFormState> {
  const name = input.name.trim();

  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { fieldErrors: { name: `Must be ${NAME_MIN}–${NAME_MAX} characters.` } };
  }

  const result = await createWorkspace({
    name,
    ...(input.icon ? { icon: input.icon } : {}),
    ...(input.color ? { color: input.color } : {}),
  });

  if (!result.ok) {
    return { code: result.code, fieldErrors: result.fieldErrors };
  }

  revalidatePath("/workspaces");
  return { done: true };
}
