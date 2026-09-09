"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreIcon } from "@/components/ui/icons";
import { ArchiveWorkspaceDialog } from "@/components/workspace/archive-workspace-dialog";
import { DeleteWorkspaceDialog } from "@/components/workspace/delete-workspace-dialog";
import { EditWorkspaceDialog } from "@/components/workspace/edit-workspace-dialog";
import { useWorkspaceMutations } from "@/components/workspace/use-workspace-mutations";
import { canDeleteWorkspace, canUpdateWorkspace } from "@/lib/roles";
import type { Workspace } from "@/types/workspace";

/**
 * Features 3 and 4 behind one trigger: edit, archive / restore, delete.
 *
 * The client leaf for all three screens that offer them — the card, the list
 * row and the detail header — so the copy, the confirmations and the
 * permission gates cannot drift between them. Everything around it stays a
 * Server Component.
 *
 * Menu entries are gated by `workspace.role` against the mirror of the API's
 * permission table in `lib/roles.ts`: a MEMBER never sees Edit or Archive, an
 * ADMIN never sees Delete. That decides what is DRAWN — `requirePermission` on
 * the API is what enforces it, and its `403` still arrives as a toast.
 */
export function WorkspaceActionsMenu({
  workspace,
  showOpenLink = false,
  onDeleted,
}: {
  workspace: Workspace;
  /** The card and the list row offer it; the detail page is already there. */
  showOpenLink?: boolean;
  /** The detail page navigates away — its own record just stopped existing. */
  onDeleted?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isPending, setArchived, remove } = useWorkspaceMutations();

  const mayUpdate = canUpdateWorkspace(workspace.role);
  const mayDelete = canDeleteWorkspace(workspace.role);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${workspace.name}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <MoreIcon className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{workspace.name}</DropdownMenuLabel>

          {showOpenLink && (
            <DropdownMenuItem href={`/workspaces/${workspace.id}`}>
              Open workspace
            </DropdownMenuItem>
          )}
          <DropdownMenuItem href={`/workspaces/${workspace.id}/members`}>
            Manage members
          </DropdownMenuItem>

          {mayUpdate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                Edit workspace
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setArchiving(true)}>
                {workspace.isArchived ? "Restore workspace" : "Archive workspace"}
              </DropdownMenuItem>
            </>
          )}

          {mayDelete && (
            <>
              <DropdownMenuSeparator />
              {/* The red is on a CHILD, not on the item's own class list.
                  `cn` is a plain join, so a `text-danger` alongside the item
                  base's `text-text-muted` would leave two colour utilities of
                  equal specificity and let stylesheet order pick the winner.
                  Inheritance has no such ambiguity. */}
              <DropdownMenuItem onSelect={() => setDeleting(true)}>
                <span className="text-danger">Delete workspace</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditWorkspaceDialog
        workspace={workspace}
        open={editing}
        onOpenChange={setEditing}
      />

      <ArchiveWorkspaceDialog
        workspaceName={workspace.name}
        isArchived={workspace.isArchived}
        open={archiving}
        pending={isPending}
        onOpenChange={setArchiving}
        onConfirm={() =>
          setArchived(workspace.id, workspace.name, !workspace.isArchived, () =>
            setArchiving(false),
          )
        }
      />

      <DeleteWorkspaceDialog
        workspaceName={workspace.name}
        open={deleting}
        pending={isPending}
        onOpenChange={setDeleting}
        onConfirm={() =>
          remove(workspace.id, workspace.name, () => {
            setDeleting(false);
            onDeleted?.();
          })
        }
      />
    </>
  );
}
