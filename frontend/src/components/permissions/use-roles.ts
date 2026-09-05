"use client";

import { useCallback, useMemo, useState } from "react";
import { draftRole } from "@/lib/demo-permissions";
import type { RoleDefinition } from "@/types/permissions";
import type { WorkspaceMember } from "@/types/workspace";

/*
 * Everything this screen can change, in one place: the role list, who holds
 * which role, and the confirmation chip.
 *
 * NOTHING PERSISTS. There is no API and no Server Action behind any of it —
 * state lives here and is gone on refresh. When the endpoints land each writer
 * below becomes one action call plus a revalidate, which is why they are
 * already named after them.
 */

/** Where holders of a deleted role land, and the fallback a new member gets. */
const FALLBACK_ROLE = "MEMBER";

export function useRoles(
  initialRoles: RoleDefinition[],
  members: WorkspaceMember[],
) {
  const [roles, setRoles] = useState(initialRoles);
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.id, member.role])),
  );
  const [notice, setNotice] = useState<string | null>(null);

  /* Stable, so `Toast`'s dismiss timer is not re-armed on every render. */
  const clearNotice = useCallback(() => setNotice(null), []);

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
    setNotice(`${role.name} created`);
  }

  function updateRole(id: string, name: string, allowed: readonly string[]) {
    setRoles((current) =>
      current.map((role) =>
        role.id === id ? { ...role, name: name.trim(), allowed } : role,
      ),
    );
    setNotice(`${name.trim()} updated`);
  }

  function deleteRole(role: RoleDefinition) {
    setRoles((current) => current.filter((entry) => entry.id !== role.id));
    /* Nobody is left holding a role that no longer exists. */
    setAssignments((current) =>
      Object.fromEntries(
        Object.entries(current).map(([memberId, roleId]) => [
          memberId,
          roleId === role.id ? FALLBACK_ROLE : roleId,
        ]),
      ),
    );
    setNotice(`${role.name} deleted`);
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

  function assignRole(member: WorkspaceMember, role: RoleDefinition) {
    if (assignments[member.id] === role.id) return;
    setAssignments((current) => ({ ...current, [member.id]: role.id }));
    setNotice(`${member.name} is now ${role.name}`);
  }

  return {
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
  };
}
