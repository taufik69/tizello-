"use client";

import { useState } from "react";
import { CancelInviteDialog } from "@/components/members/cancel-invite-dialog";
import { PendingInvitesList } from "@/components/members/pending-invites-list";
import type { PendingInvitation } from "@/types/workspace";

/*
 * The pending half of the members screen. The array itself lives one level up
 * in `MembersPanel`, because the tab strip renders its count; this leaf owns
 * the two pieces of state the rows cannot — which invitation is awaiting a
 * cancel confirmation, and which have been resent this session.
 *
 * RESEND SENDS NOTHING. There is no mail service and no Server Action behind
 * this button: it marks the row and announces itself so the click has a
 * visible and an audible result, and that is all. When
 * `POST /invitations/:id/resend` lands, `resend` becomes one action call.
 */
export function PendingInvitesPanel({
  invitations,
  workspaceName,
  onCancel,
}: {
  invitations: PendingInvitation[];
  workspaceName: string;
  onCancel: (invitationId: string) => void;
}) {
  const [pendingCancel, setPendingCancel] = useState<PendingInvitation | null>(
    null,
  );
  const [resentIds, setResentIds] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");

  function resend(invitation: PendingInvitation) {
    setResentIds((current) =>
      current.includes(invitation.id) ? current : [...current, invitation.id],
    );
    setAnnouncement(`Invitation resent to ${invitation.email}.`);
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

      {/* The resend has no other audible result — the row's "· Resent" is
          silent to anyone not looking at it. */}
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <CancelInviteDialog
        invitation={pendingCancel}
        workspaceName={workspaceName}
        onOpenChange={() => setPendingCancel(null)}
        onConfirm={confirmCancel}
      />
    </>
  );
}
