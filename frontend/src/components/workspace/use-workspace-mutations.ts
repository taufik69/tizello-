"use client";

import { useTransition } from "react";
import {
  deleteWorkspaceAction,
  setWorkspaceArchivedAction,
} from "@/lib/actions/workspace-actions";
import { WORKSPACE_ERROR_COPY } from "@/types/workspace";
import { toast } from "sonner";

/**
 * The two confirm-then-write flows of feature 4, in one place.
 *
 * Both the workspace card, the list row and the detail header offer archive and
 * delete, and all three need the same three steps around the Server Action:
 * hold a pending flag so the confirm button can disable, turn a `code` into
 * copy from `WORKSPACE_ERROR_COPY` (never a server string), and close the
 * dialog only once the write has actually landed.
 *
 * Nothing here updates a local list. Both actions call `revalidatePath`, so the
 * row leaves — or returns to — the list when the router refetches. An optimistic
 * removal would have to be undone on a `403`, and a workspace that vanishes and
 * reappears reads as a bug rather than as a failure.
 */
export function useWorkspaceMutations() {
  const [isPending, startTransition] = useTransition();

  function fail(code: string) {
    toast.error(WORKSPACE_ERROR_COPY[code] ?? WORKSPACE_ERROR_COPY.SERVER_ERROR);
  }

  /** `isArchived: false` is the restore — one endpoint, both directions. */
  function setArchived(
    workspaceId: string,
    workspaceName: string,
    isArchived: boolean,
    onDone: () => void,
  ) {
    startTransition(async () => {
      const result = await setWorkspaceArchivedAction(workspaceId, isArchived);

      if (result.code) {
        fail(result.code);
        return;
      }

      toast.success(
        isArchived
          ? `${workspaceName} archived. Find it again under Archived.`
          : `${workspaceName} restored.`,
      );
      onDone();
    });
  }

  function remove(workspaceId: string, workspaceName: string, onDone: () => void) {
    startTransition(async () => {
      const result = await deleteWorkspaceAction(workspaceId);

      if (result.code) {
        fail(result.code);
        return;
      }

      toast.success(`${workspaceName} deleted.`);
      onDone();
    });
  }

  return { isPending, setArchived, remove };
}
