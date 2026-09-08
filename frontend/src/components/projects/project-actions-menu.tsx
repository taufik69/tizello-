"use client";

import { useState } from "react";
import { ProjectActionsList } from "@/components/projects/project-actions-list";
import { ArchiveProjectDialog } from "@/components/projects/archive-project-dialog";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { EditProjectDrawerShell } from "@/components/projects/edit-project-drawer-shell";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import type { ProjectScope } from "@/components/projects/project-properties";
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
 *
 * The menu itself is next door in `project-actions-list.tsx`. This file owns
 * what the menu OPENS — three overlays and the pending flag they share — and
 * splitting the two is what keeps either under the 150-line cap.
 */
export function ProjectActionsMenu({
  project,
  workspaceRole,
  scope,
  meta,
  showOpenLink = false,
  onDeleted,
}: {
  project: ProjectRecord;
  workspaceRole: WorkspaceRole;
  scope: ProjectScope;
  /** The edit drawer's read-only facts block. Only the detail page has the member list to build one. */
  meta?: React.ReactNode;
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
      <ProjectActionsList
        project={project}
        mayWrite={mayWrite}
        mayOwn={mayOwn}
        showOpenLink={showOpenLink}
        onEdit={() => setEditing(true)}
        onArchive={() => setArchiving(true)}
        onDelete={() => setDeleting(true)}
      />

      <EditProjectDrawerShell
        project={project}
        workspaceId={project.workspaceId}
        today={scope.today}
        definitions={scope.definitions}
        canManageProperties={scope.canManageProperties}
        meta={meta}
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
