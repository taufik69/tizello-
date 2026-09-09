"use client";

import { useState, useTransition } from "react";
import { updateMemberRoleAction } from "@/lib/actions/member-actions";
import { memberErrorCopy } from "@/lib/member-error-copy";
import { toast } from "sonner";
import type { RoleDefinition } from "@/types/permissions";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/*
 * Who holds which role — the one part of this screen that is REAL.
 *
 * Split out of `useRoles` rather than written inside it because the two halves
 * of this screen no longer have the same status, and that difference is worth a
 * file boundary. Creating, editing and deleting a role is still fixture state
 * (`demo-permissions.ts`): the API has exactly three roles and no endpoint for
 * defining a fourth. Assigning one of those three to a member is
 * `PATCH /workspaces/:id/members/:memberId`, and goes through the same action
 * the members screen uses.
 *
 * **A custom role cannot be assigned, and says so.** `role-reviewer` exists on
 * this screen and nowhere on the server, so writing it would either fail with a
 * validation error the user cannot act on or — worse — appear to work and be
 * gone on reload. Refusing with a sentence is the honest option until custom
 * roles are real.
 */

/** The three the API knows. Anything else is a fixture. */
const WORKSPACE_ROLE_IDS = new Set<string>(["OWNER", "ADMIN", "MEMBER"]);

const isWorkspaceRole = (id: string): id is WorkspaceRole => WORKSPACE_ROLE_IDS.has(id);

const CUSTOM_ROLE_REFUSAL =
  "Custom roles can't be assigned yet — they exist on this screen only.";

/** Ownership is transferred, never granted. Same rule as the members screen. */
const OWNER_REFUSAL = "Ownership is transferred, not assigned as a role.";

export function useRoleAssignment(members: WorkspaceMember[], workspaceId: string) {
  /* Member id → role id. Seeded from the roster the server sent, and the only
     thing that moves it afterwards is a successful write (or a rollback). */
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(members.map((member) => [member.id, member.role])),
  );
  const [isPending, startTransition] = useTransition();

  function assignRole(member: WorkspaceMember, role: RoleDefinition) {
    if (assignments[member.id] === role.id) return;

    if (!isWorkspaceRole(role.id)) {
      toast.error(CUSTOM_ROLE_REFUSAL);
      return;
    }

    if (role.id === "OWNER") {
      toast.error(OWNER_REFUSAL);
      return;
    }

    const previous = assignments[member.id] ?? member.role;
    setAssignments((current) => ({ ...current, [member.id]: role.id }));

    startTransition(async () => {
      const result = await updateMemberRoleAction({
        workspaceId,
        memberId: member.id,
        role: role.id as WorkspaceRole,
      });

      if (!result.ok) {
        /* Back to the value captured before the optimistic write. The role
           cards' counts are derived from this map, so a failed write that left
           it alone would also leave a count one too high. */
        setAssignments((current) => ({ ...current, [member.id]: previous }));
        toast.error(memberErrorCopy(result.code));
        return;
      }

      toast.success(`${member.name} is now ${role.name}`);
    });
  }

  /**
   * Drops holders of a deleted role back to MEMBER — locally only.
   *
   * Deleting a custom role is fixture state, so the members who "held" it were
   * never anything but MEMBER on the server: this realigns the screen with what
   * the API already believes rather than writing anything.
   */
  function releaseRole(roleId: string) {
    setAssignments((current) =>
      Object.fromEntries(
        Object.entries(current).map(([memberId, held]) => [
          memberId,
          held === roleId ? "MEMBER" : held,
        ]),
      ),
    );
  }

  return { assignments, assignRole, releaseRole, isPending };
}
