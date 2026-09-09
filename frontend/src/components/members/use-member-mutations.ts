"use client";

import { useState, useTransition } from "react";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/member-actions";
import { memberErrorCopy, removalBlockedCopy } from "@/lib/member-error-copy";
import { sortMembers } from "@/lib/member-sort";
import { toast } from "sonner";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/*
 * The roster, as edited — and the two writes that edit it.
 *
 * Extracted from `MembersPanel` rather than written inline: the panel also owns
 * the tabs, the invitations and two dialogs, and the 150-line cap
 * (`.claude/rules/ui-components.md` §4) is the signal that those are two
 * concerns. The precedent is `use-project-board-dnd.ts` — a hook beside the
 * components that use it, not in `lib/`, because it holds React state.
 *
 * **The two writes are optimistic in opposite directions, on purpose.**
 *
 * A ROLE CHANGE applies immediately and rolls back on failure. The user picked a
 * value from a menu that was already gated by their own permission, so success
 * is the overwhelmingly likely outcome, and a chip that waits for a round-trip
 * before moving feels broken.
 *
 * A REMOVAL waits for the server. It can fail for a reason the client cannot
 * predict — `member.md` §3's `409`, a member who still owns projects — and a row
 * that vanishes and then reappears reads as a bug, where a half-second pause
 * reads as work. This is the same call `MembersPanel` already makes for sending
 * an invitation.
 *
 * Neither retries. `NOT_FOUND` from a removal means the row is already gone, and
 * the API's removal is deliberately not idempotent.
 */

export function useMemberMutations(
  initial: WorkspaceMember[],
  workspaceId: string,
) {
  const [members, setMembers] = useState(initial);
  const [pendingRemoval, setPendingRemoval] = useState<WorkspaceMember | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeRole(memberId: string, role: WorkspaceRole) {
    const previous = members;
    const target = members.find((member) => member.id === memberId);
    if (!target || target.role === role) return;

    setMembers((current) =>
      sortMembers(
        current.map((member) =>
          member.id === memberId ? { ...member, role } : member,
        ),
      ),
    );

    startTransition(async () => {
      const result = await updateMemberRoleAction({ workspaceId, memberId, role });

      if (!result.ok) {
        /* Back to the array captured before the optimistic write, not a
           reverse-patch of the current one: the action is the only thing that
           mutates this list, so `previous` is still accurate, and reconstructing
           the old role from the new one would be a second source of truth. */
        setMembers(previous);
        toast.error(memberErrorCopy(result.code));
        return;
      }

      /* The server's row, not the optimistic one — it is the authority on what
         the role now is, and it carries a name and address that may have
         changed since this page was rendered. */
      setMembers((current) =>
        sortMembers(
          current.map((member) => (member.id === memberId ? result.data : member)),
        ),
      );
      toast.success(`${result.data.name} is now ${role === "ADMIN" ? "an admin" : "a member"}.`);
    });
  }

  function confirmRemoval() {
    const target = pendingRemoval;
    if (!target) return;

    setPendingRemoval(null);

    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, target.id);

      if (!result.ok) {
        toast.error(
          result.projects
            ? removalBlockedCopy(target.name, result.projects)
            : memberErrorCopy(result.code),
        );
        return;
      }

      setMembers((current) => current.filter((member) => member.id !== target.id));
      toast.success(`${target.name} was removed from the workspace.`);
    });
  }

  return {
    members,
    isPending,
    pendingRemoval,
    setPendingRemoval,
    changeRole,
    confirmRemoval,
  };
}
