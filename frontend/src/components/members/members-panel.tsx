"use client";

import { useState, useTransition } from "react";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { MembersList } from "@/components/members/members-list";
import { MembersToolbar } from "@/components/members/members-toolbar";
import { PendingInvitesPanel } from "@/components/members/pending-invites-panel";
import { RemoveMemberDialog } from "@/components/members/remove-member-dialog";
import { TabPanel, type TabDescriptor } from "@/components/ui/tabs";
import {
  inviteMemberAction,
  revokeInvitationAction,
} from "@/lib/actions/invitation-actions";
import { inviteErrorCopy } from "@/lib/invite-error-copy";
import { sortInvitations } from "@/lib/invite-sort";
import { toast } from "@/lib/toast-store";
import { sortMembers } from "@/lib/demo-members";
import type {
  InvitableRole,
  PendingInvitation,
  WorkspaceMember,
  WorkspaceRole,
} from "@/types/workspace";

/*
 * The interactive half of the members screen. The page above it stays a Server
 * Component and hands both fetched lists down as props; this leaf owns what a
 * static tree cannot: which tab is up, the roster as edited, the outstanding
 * invitations, and which removal is awaiting confirmation.
 *
 * Both arrays live here rather than in their panels because the tab strip
 * renders their counts. The panels below own only their own dialogs.
 *
 * Invitations are REAL: invite and cancel call Server Actions, which call the
 * API and revalidate this route. The list is still held in state so the row
 * appears the instant the action resolves rather than after the router has
 * finished refetching — the revalidate is what makes it survive a reload, the
 * local update is what makes it feel immediate.
 *
 * Roster edits (role change, remove) are still `useState` only: there is no
 * member module on the API yet, so those endpoints do not exist. That is the
 * one thing on this screen that still does not persist.
 */
const GROUP = "members";

export function MembersPanel({
  members: roster,
  invitations,
  currentUserId,
  workspaceId,
  workspaceName,
}: {
  members: WorkspaceMember[];
  invitations: PendingInvitation[];
  currentUserId: string;
  workspaceId: string;
  workspaceName: string;
}) {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState(roster);
  const [invites, setInvites] = useState(invitations);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<WorkspaceMember | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const tabs: TabDescriptor[] = [
    { value: "members", label: "Members", count: members.length },
    { value: "pending", label: "Pending", count: invites.length },
  ];

  function changeRole(memberId: string, role: WorkspaceRole) {
    setMembers((current) =>
      sortMembers(
        current.map((member) =>
          member.id === memberId ? { ...member, role } : member,
        ),
      ),
    );
  }

  /* An invitation creates a PENDING row rather than a member: nobody has
     accepted, so nobody belongs on the roster yet.

     The row is added only AFTER the action succeeds, not optimistically. An
     invite can fail for reasons the client cannot predict — already a member,
     already invited, no permission — and showing a row that then disappears is
     worse than a half-second wait. `new Date()` is safe here: this runs in an
     event handler, never during a render the server also performed, so there is
     nothing for hydration to disagree with. */
  function invite(email: string, role: InvitableRole) {
    startTransition(async () => {
      const result = await inviteMemberAction({ workspaceId, email, role });

      if (!result.ok) {
        toast.error(inviteErrorCopy(result.code));
        return;
      }

      setInvites((current) =>
        sortInvitations([
          ...current,
          {
            id: crypto.randomUUID(),
            email,
            role,
            invitedAt: new Date().toISOString(),
            status: "PENDING",
          },
        ]),
      );
      setTab("pending");
      toast.success(`Invitation sent to ${email}.`);
    });
  }

  function cancelInvite(invitationId: string) {
    const cancelled = invites.find((entry) => entry.id === invitationId);

    startTransition(async () => {
      const result = await revokeInvitationAction(workspaceId, invitationId);

      if (!result.ok) {
        toast.error(inviteErrorCopy(result.code));
        return;
      }

      setInvites((current) =>
        current.filter((invitation) => invitation.id !== invitationId),
      );
      toast.success(
        cancelled
          ? `Invitation to ${cancelled.email} cancelled.`
          : "Invitation cancelled.",
      );
    });
  }

  function confirmRemoval() {
    setMembers((current) =>
      current.filter((member) => member.id !== pendingRemoval?.id),
    );
    setPendingRemoval(null);
  }

  return (
    <section className="mt-8">
      <MembersToolbar
        group={GROUP}
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
        onInvite={() => setInviteOpen(true)}
      />

      <TabPanel group={GROUP} value="members" active={tab === "members"}>
        <MembersList
          members={members}
          currentUserId={currentUserId}
          onRoleChange={changeRole}
          onRemove={setPendingRemoval}
        />
      </TabPanel>

      <TabPanel group={GROUP} value="pending" active={tab === "pending"}>
        <PendingInvitesPanel
          invitations={invites}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onCancel={cancelInvite}
        />
      </TabPanel>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        workspaceName={workspaceName}
        pending={isPending}
        onInvite={invite}
      />

      <RemoveMemberDialog
        member={pendingRemoval}
        workspaceName={workspaceName}
        onOpenChange={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
      />
    </section>
  );
}
