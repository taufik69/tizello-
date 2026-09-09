"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  deleteProjectAction,
  setProjectArchivedAction,
} from "@/lib/actions/project-actions";
import { PROJECT_ERROR_COPY } from "@/types/project";

/**
 * The two confirm-then-write flows for a project, in one place.
 *
 * The card, the table row and the detail header all offer archive and delete,
 * and all three need the same three steps around the Server Action: hold a
 * pending flag so the confirm button can disable, turn a `code` into copy from
 * `PROJECT_ERROR_COPY` (never a server string), and close the dialog only once
 * the write has actually landed. Same arrangement as
 * `use-workspace-mutations.ts`.
 *
 * Nothing here updates a local list. Both actions call `revalidatePath`, so the
 * row leaves — or returns to — the list when the router refetches. An
 * optimistic removal would have to be undone on a `403`, and a project that
 * vanishes and reappears reads as a bug rather than as a failure.
 */
export function useProjectMutations(workspaceId: string) {
  const [isPending, startTransition] = useTransition();

  function fail(code: string) {
    toast.error(PROJECT_ERROR_COPY[code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
  }

  /** `isArchived: false` is the restore — one endpoint, both directions. */
  function setArchived(
    projectId: string,
    projectName: string,
    isArchived: boolean,
    onDone: () => void,
  ) {
    startTransition(async () => {
      const result = await setProjectArchivedAction(workspaceId, projectId, isArchived);

      if (result.code) {
        fail(result.code);
        return;
      }

      toast.success(
        isArchived
          ? `${projectName} archived. Find it again under Archived.`
          : `${projectName} restored.`,
      );
      onDone();
    });
  }

  function remove(projectId: string, projectName: string, onDone: () => void) {
    startTransition(async () => {
      const result = await deleteProjectAction(workspaceId, projectId);

      if (result.code) {
        fail(result.code);
        return;
      }

      toast.success(`${projectName} deleted.`);
      onDone();
    });
  }

  return { isPending, setArchived, remove };
}
