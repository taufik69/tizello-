"use client";

import { useState, useTransition } from "react";
import { CancelInviteDialog } from "@/components/members/cancel-invite-dialog";
import { PendingInvitesList } from "@/components/members/pending-invites-list";
import { resendInvitationAction } from "@/lib/actions/invitation-actions";
import { inviteErrorCopy } from "@/lib/invite-error-copy";
import { toast } from "@/lib/toast-store";
import type { PendingInvitation } from "@/types/workspace";

/*
 * The pending half of the members screen. The array itself lives one level up
 * in `MembersPanel`, because the tab strip renders its count; this leaf owns
 * the two pieces of state the rows cannot — which invitation is awaiting a
 * cancel confirmation, and which have been resent this session.
 *
 * RESEND IS REAL, and it **rotates the token**: the previous link stops working
 * the moment it succeeds. That is the point — resending is what an admin does
 * when they suspect the first link went astray, and leaving the old one live
 * would defeat the gesture.
 *
 * The row is marked resent only after the action returns, so the marker never
 * claims a send that failed.
 */
export function PendingInvitesPanel({
  invitations,
  workspaceId,
  workspaceName,
  onCancel,
}: {
  invitations: PendingInvitation[];
  workspaceId: string;
  workspaceName: string;
  onCancel: (invitationId: string) => void;
}) {
  const [pendingCancel, setPendingCancel] = useState<PendingInvitation | null>(
    null,
  );
  const [resentIds, setResentIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  function resend(invitation: PendingInvitation) {
    startTransition(async () => {
      const result = await resendInvitationAction(workspaceId, invitation.id);

      if (!result.ok) {
        toast.error(inviteErrorCopy(result.code));
        return;
      }

      setResentIds((current) =>
        current.includes(invitation.id) ? current : [...current, invitation.id],
      );

      /* The toast is the audible result too: it renders inside the polite live
         region in `Toaster`, so the separate sr-only announcer this component
         used to carry would now say the same sentence twice. */
      toast.success("Invitation resent to " + invitation.email + ".");
    });
  }

  function confirmCancel() {
    if (pendingCancel) onCancel(pendingCancel.id);
    setPendingCancel(null);
  }

  return (
    <>
      <PendingInvitesList
        invitations={invitations}
        resentIds={resentIds}
        onResend={resend}
        onCancel={setPendingCancel}
      />

      <CancelInviteDialog
        invitation={pendingCancel}
        workspaceName={workspaceName}
        onOpenChange={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
      />
    </>
  );
}
