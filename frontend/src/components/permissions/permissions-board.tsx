"use client";

import { useState } from "react";
import { MemberRoleList } from "@/components/permissions/member-role-list";
import { PermissionMatrix } from "@/components/permissions/permission-matrix";
import { RoleCards } from "@/components/permissions/role-cards";
import { RoleDialog } from "@/components/permissions/role-dialog";
import { useRoles } from "@/components/permissions/use-roles";
import { Toast } from "@/components/ui/toast";
import type { PermissionGroup, RoleDefinition } from "@/types/permissions";
import type { WorkspaceMember } from "@/types/workspace";

/*
 * The screen's one client boundary: the roles, the matrix and the roster all
 * read the same state, so they sit under one leaf rather than three that would
 * have to be kept in sync. The page above stays a Server Component and hands
 * the fixtures down as plain props.
 *
 * `editing` is `undefined` when the dialog is shut, `null` when it is open to
 * create, and a role when it is open to edit — one piece of state rather than
 * an open flag that can disagree with a target.
 */
export function PermissionsBoard({
  groups,
  roles: initialRoles,
  members,
  currentUserId,
}: {
  groups: PermissionGroup[];
  roles: RoleDefinition[];
  members: WorkspaceMember[];
  currentUserId: string;
}) {
  const {
    roles,
    assignments,
    memberCounts,
    notice,
    clearNotice,
    createRole,
    updateRole,
    deleteRole,
    toggleAction,
    assignRole,
  } = useRoles(initialRoles, members);

  const [editing, setEditing] = useState<RoleDefinition | null | undefined>();
  const actionCount = groups.reduce(
    (total, group) => total + group.actions.length,
    0,
  );

  function submitRole(name: string, allowed: readonly string[]) {
    if (editing) updateRole(editing.id, name, allowed);
    else createRole(name, allowed);
  }

  return (
    <>
      <RoleCards
        roles={roles}
        memberCounts={memberCounts}
        actionCount={actionCount}
        onCreate={() => setEditing(null)}
        onEdit={(role) => setEditing(role)}
        onDelete={deleteRole}
      />

      <PermissionMatrix
        groups={groups}
        roles={roles}
        onToggle={toggleAction}
      />

      <MemberRoleList
        members={members}
        roles={roles}
        assignments={assignments}
        currentUserId={currentUserId}
        onAssign={assignRole}
      />

      {/* Mounted only while open, so the draft inside starts from `editing`
          without an effect copying props into state. */}
      {editing !== undefined && (
        <RoleDialog
          open
          onOpenChange={() => setEditing(undefined)}
          role={editing}
          groups={groups}
          onSubmit={submitRole}
        />
      )}

      <Toast message={notice} onDismiss={clearNotice} />
    </>
  );
}
