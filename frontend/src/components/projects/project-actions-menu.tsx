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
import { ArchiveProjectDialog } from "@/components/projects/archive-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import { canOwnProject, canWriteProject } from "@/lib/project-roles";
import type { ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * Edit, archive / restore and delete behind one trigger.
 *
 * The client leaf for every screen that offers them — the card, the table rows
 * and the detail header — so the copy, the confirmations and the permission
 * gates cannot drift between them. Everything around it stays a Server
 * Component.
 *
 * Entries are gated by BOTH roles, because the API's ladder needs both
 * (project.md §*Guards*): `workspaceRole` carries the OWNER/ADMIN escape
 * hatch, `project.viewerRole` the per-project one. A COLLABORATOR sees
 * neither Edit nor Delete; a MANAGER sees Edit and Archive but not Delete,
 * which is the one place the two predicates disagree. That decides what is
 * DRAWN — `requireProjectWrite` / `requireProjectOwner` on the API is what
 * enforces it, and their `403` still arrives as a toast.
 */
export function ProjectActionsMenu({
  project,
  workspaceRole,
  showOpenLink = false,
  onDeleted,
}: {
  project: ProjectRecord;
  workspaceRole: WorkspaceRole;
  /** The card and the row offer it; the detail page is already there. */
  showOpenLink?: boolean;
  /** The detail page navigates away — its own record just stopped existing. */
  onDeleted?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { isPending, setArchived, remove } = useProjectMutations(project.workspaceId);

  const mayWrite = canWriteProject(workspaceRole, project.viewerRole);
  const mayOwn = canOwnProject(workspaceRole, project.viewerRole);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${project.name}`}
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <MoreIcon className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{project.name}</DropdownMenuLabel>

          {showOpenLink && (
            <DropdownMenuItem
              href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
            >
              Open project
            </DropdownMenuItem>
          )}

          {mayWrite && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                Edit project
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setArchiving(true)}>
                {project.isArchived ? "Restore project" : "Archive project"}
              </DropdownMenuItem>
            </>
          )}

          {mayOwn && (
            <>
              <DropdownMenuSeparator />
              {/* The red is on a CHILD, not on the item's own class list.
                  `cn` is a plain join, so a `text-danger` alongside the item
                  base's `text-text-muted` would leave two colour utilities of
                  equal specificity and let stylesheet order pick the winner.
                  Inheritance has no such ambiguity. */}
              <DropdownMenuItem onSelect={() => setDeleting(true)}>
                <span className="text-danger">Delete project</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProjectDialog
        project={project}
        workspaceId={project.workspaceId}
        open={editing}
        onOpenChange={setEditing}
      />

      <ArchiveProjectDialog
        projectName={project.name}
        isArchived={project.isArchived}
        open={archiving}
        pending={isPending}
        onOpenChange={setArchiving}
        onConfirm={() =>
          setArchived(project.id, project.name, !project.isArchived, () =>
            setArchiving(false),
          )
        }
      />

      <DeleteProjectDialog
        projectName={project.name}
        projectKey={project.key}
        open={deleting}
        pending={isPending}
        onOpenChange={setDeleting}
        onConfirm={() =>
          remove(project.id, project.name, () => {
            setDeleting(false);
            onDeleted?.();
          })
        }
      />
    </>
  );
}
