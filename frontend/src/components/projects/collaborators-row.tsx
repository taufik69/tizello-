"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { PropertyRow } from "@/components/projects/property-row";
import { useMenuPopover } from "@/components/projects/use-menu-popover";
import { PersonChip, PersonOption } from "@/components/projects/person-chip";
import {
  addProjectMemberAction,
  removeProjectMemberAction,
} from "@/lib/actions/project-member-actions";
import type { WorkspaceMemberRow } from "@/lib/workspaces";
import { PROJECT_ERROR_COPY, type ProjectMemberRecord } from "@/types/project";

/**
 * The Collaborators row: who is on this project, and a picker of workspace
 * members to add.
 *
 * These are real `ProjectMember` rows, not a custom `PERSON` property. The
 * project module already owns adding, removing and role-changing them, with
 * the invariants that go with it — the owner cannot be removed, ownership
 * moves only through transfer. A person-shaped custom property beside all that
 * would be a second, unenforced answer to "who is on this project".
 *
 * IT WRITES IMMEDIATELY, unlike the property values around it, because it is
 * not a field of the project — it is a row in another table. Holding it behind
 * the drawer's Save would mean a "collaborator" who exists only in this form.
 *
 * The owner is drawn but has no remove control: the API answers `409` for it
 * (ownership moves through transfer), and a ✕ that refuses is worse than no ✕.
 *
 * EDIT ONLY. A project that does not exist yet has no members to add to — the
 * create drawer omits this row, and the creator becomes OWNER on save.
 */
const PANEL_HEIGHT = 300;

export function CollaboratorsRow({
  projectId,
  workspaceId,
  ownerId,
  members,
  workspaceMembers,
  canWrite,
}: {
  projectId: string;
  workspaceId: string;
  ownerId: string;
  members: ProjectMemberRecord[];
  /** Everyone in the workspace — the pool to add from. */
  workspaceMembers: WorkspaceMemberRow[];
  canWrite: boolean;
}) {
  const [rows, setRows] = useState(members);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const position = useMenuPopover({
    open,
    triggerRef,
    panelRef,
    height: PANEL_HEIGHT,
    onDismiss: () => {
      setOpen(false);
      triggerRef.current?.focus();
    },
  });

  const onProject = new Set(rows.map((row) => row.userId));
  const available = workspaceMembers.filter((member) => !onProject.has(member.userId));

  function add(member: WorkspaceMemberRow) {
    startTransition(async () => {
      const result = await addProjectMemberAction(workspaceId, projectId, member.userId);

      if (result.code) {
        toast.error(PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
        return;
      }

      setRows((current) => [...current, result.member!]);
      setOpen(false);
    });
  }

  function remove(row: ProjectMemberRecord) {
    startTransition(async () => {
      const result = await removeProjectMemberAction(workspaceId, projectId, row.userId);

      if (result.code) {
        toast.error(PROJECT_ERROR_COPY[result.code] ?? PROJECT_ERROR_COPY.SERVER_ERROR);
        return;
      }

      setRows((current) => current.filter((entry) => entry.userId !== row.userId));
    });
  }

  return (
    <PropertyRow label="Collaborators" icon="people">
      <div className="rounded-sm border border-transparent px-2.5 py-1.5 transition-colors duration-100 ease-standard hover:bg-surface-hover">
        {rows.length === 0 && !canWrite && (
          <p className="text-sm text-text-subtle">Empty</p>
        )}

        <ul className="flex flex-wrap items-center gap-1.5">
          {rows.map((row) => {
            const name = row.user?.name ?? row.user?.email ?? row.userId;
            const isOwner = row.userId === ownerId;

            return (
              <PersonChip
                key={row.id}
                name={name}
                /* The owner has no remove control: the API answers `409` for
                   it (ownership moves through transfer), and a ✕ that refuses
                   is worse than no ✕. */
                onRemove={canWrite && !isOwner ? () => remove(row) : undefined}
                disabled={isPending}
              />
            );
          })}

          {canWrite && (
            <li>
              <button
                ref={triggerRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                disabled={isPending || available.length === 0}
                onClick={() => setOpen((value) => !value)}
                className="rounded-xs px-1.5 py-0.5 text-2xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-text disabled:opacity-50"
              >
                {rows.length === 0 ? "Add someone" : "+ Add"}
              </button>
            </li>
          )}
        </ul>
      </div>

      {open && (
        <div
          ref={panelRef}
          popover="manual"
          role="menu"
          aria-label="Add a collaborator"
          className="fixed inset-auto m-0 max-h-72 w-64 overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-overlay"
          style={{ top: position.top, left: position.left }}
        >
          {available.map((member) => (
            <PersonOption
              key={member.userId}
              name={member.user?.name ?? member.user?.email ?? member.userId}
              disabled={isPending}
              onSelect={() => add(member)}
            />
          ))}
        </div>
      )}
    </PropertyRow>
  );
}
