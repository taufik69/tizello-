"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRoleAssignment } from "@/components/permissions/use-role-assignment";
import { draftRole } from "@/lib/demo-permissions";
import type { RoleDefinition } from "@/types/permissions";
import type { WorkspaceMember } from "@/types/workspace";

/*
 * Everything this screen can change, in one place: the role list, who holds
 * which role, and the confirmation chip.
 *
 * **The two halves no longer have the same status.** Defining a role — create,
 * edit, delete, and every cell of the matrix — is still fixture state, because
 * the API has exactly three roles and no endpoint for a fourth. ASSIGNING one
 * of those three to a member is real, and lives in `useRoleAssignment`, which
 * calls `PATCH /workspaces/:id/members/:memberId` through the same action the
 * members screen uses.
 *
 * So a role card's name changes and is gone on refresh; a member's role changes
 * and stays. That is confusing, and it is the truth — writing a fourth role to
 * an API with three would be worse.
 */

export function useRoles(
  initialRoles: RoleDefinition[],
  members: WorkspaceMember[],
  workspaceId: string,
) {
  const [roles, setRoles] = useState(initialRoles);

  /* Who holds what, and the one write on this screen that reaches the API. */
  const { assignments, assignRole, releaseRole, isPending } = useRoleAssignment(
    members,
    workspaceId,
  );

  /* Derived, never authored: a card cannot quote a count the list disagrees
     with, and a role reassigned below updates both at once. */
  const memberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const roleId of Object.values(assignments)) {
      counts[roleId] = (counts[roleId] ?? 0) + 1;
    }
    return counts;
  }, [assignments]);

  function createRole(name: string, allowed: readonly string[]) {
    const role = draftRole(name, allowed);
    setRoles((current) => [...current, role]);
    toast.success(`${role.name} created`);
  }

  function updateRole(id: string, name: string, allowed: readonly string[]) {
    setRoles((current) =>
      current.map((role) =>
        role.id === id ? { ...role, name: name.trim(), allowed } : role,
      ),
    );
    toast.success(`${name.trim()} updated`);
  }

  function deleteRole(role: RoleDefinition) {
    setRoles((current) => current.filter((entry) => entry.id !== role.id));
    /* Nobody is left holding a role that no longer exists. */
    releaseRole(role.id);
    toast.success(`${role.name} deleted`);
  }

  /** One cell of the matrix. Built-in roles are read-only; the caller checks. */
  function toggleAction(roleId: string, actionId: string) {
    setRoles((current) =>
      current.map((role) =>
        role.id === roleId
          ? {
              ...role,
              allowed: role.allowed.includes(actionId)
                ? role.allowed.filter((id) => id !== actionId)
                : [...role.allowed, actionId],
            }
          : role,
      ),
    );
  }

  return {
    roles,
    assignments,
    memberCounts,
    createRole,
    updateRole,
    deleteRole,
    toggleAction,
    assignRole,
    isAssigning: isPending,
  };
}
