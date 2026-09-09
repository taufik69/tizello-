"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProjectAction } from "@/lib/actions/project-actions";
import {
  PROJECT_ERROR_COPY,
  PROJECT_STATUS_LABEL,
  type ProjectStatus,
} from "@/types/project";

/**
 * `PATCH /projects/:id` with a new status — the one thing a drop on the board
 * actually persists.
 *
 * Split from the board because the board is composition and a gesture:
 * `use-project-board-dnd.ts` owns the pointer and `lib/project-board-order.ts`
 * owns the map a drop writes into, so all that is left here is the write and
 * what to do when it is refused.
 *
 * A FAILED WRITE IS A TOAST, NOT A REVERT. By the time this can fail, the drop
 * has already committed the card's new column to client state and the slide
 * has played; yanking it back would be a second animation arguing with the
 * first. The revalidation that follows any refusal carries the server's real
 * status, and `reconcile` puts the card back — so the correction arrives on its
 * own, a beat later, and only if it is actually needed.
 */
export function useProjectStatusWrite(workspaceId: string) {
  const [, startTransition] = useTransition();

  return function write(
    projectId: string,
    projectName: string,
    to: ProjectStatus,
  ) {
    startTransition(async () => {
      const result = await updateProjectAction(workspaceId, projectId, {
        status: to,
      });

      if (!result.code && !result.fieldErrors) {
        toast.success(`${projectName} moved to ${PROJECT_STATUS_LABEL[to]}.`);
        return;
      }

      /* The API's `requireProjectWrite` is the real gate — a card only offers a
         handle to someone who can obviously move it, and a `403` for anyone
         else still has to land somewhere other than silence. */
      toast.error(
        PROJECT_ERROR_COPY[result.code ?? "SERVER_ERROR"] ??
          PROJECT_ERROR_COPY.SERVER_ERROR,
      );
    });
  };
}
