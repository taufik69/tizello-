"use client";

import { useRouter } from "next/navigation";
import { WorkspaceActionsMenu } from "@/components/workspace/workspace-actions-menu";
import type { Workspace } from "@/types/workspace";

/**
 * `WorkspaceActionsMenu` with the one thing only the detail page needs: after a
 * delete, the record this page is built on no longer exists, so staying here
 * means rendering a 404 the person did not ask for. `replace` rather than
 * `push` — the deleted workspace's URL must not be one Back returns to.
 *
 * A separate leaf so the menu itself stays free of `next/navigation`: the card
 * and the list row delete a row from a list they are still on and must not
 * navigate anywhere.
 */
export function WorkspaceDetailActions({ workspace }: { workspace: Workspace }) {
  const router = useRouter();

  return (
    <WorkspaceActionsMenu
      workspace={workspace}
      onDeleted={() => router.replace("/workspaces")}
    />
  );
}
