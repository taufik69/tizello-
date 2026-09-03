"use client";

import { useState } from "react";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { MembersList } from "@/components/members/members-list";
import { MembersToolbar } from "@/components/members/members-toolbar";
import { PendingInvitesPanel } from "@/components/members/pending-invites-panel";
import { RemoveMemberDialog } from "@/components/members/remove-member-dialog";
import { TabPanel, type TabDescriptor } from "@/components/ui/tabs";
import { sortInvitations } from "@/lib/demo-invites";
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
 * NOTHING PERSISTS. There is no API and no Server Action behind any of this —
 * every change lives in `useState` and is gone on refresh. When the real
 * endpoints land, each handler becomes an action call plus a revalidate.
 */
const GROUP = "members";

export function MembersPanel({
  members: roster,
  invitations,
  currentUserId,
  workspaceName,
}: {
  members: WorkspaceMember[];
  invitations: PendingInvitation[];
  currentUserId: string;
  workspaceName: string;
}) {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState(roster);
  const [invites, setInvites] = useState(invitations);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<WorkspaceMember | null>(
    null,
  );

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

  /* An invitation now creates a PENDING row rather than a member: nobody has
     accepted, so nobody belongs on the roster yet. `Date.now()` is safe here —
     this runs in an event handler, never during a render that the server also
     performed, so there is nothing for hydration to disagree with. */
  function invite(email: string, role: InvitableRole) {
    const invitation: PendingInvitation = {
      id: crypto.randomUUID(),
      email,
      role,
      invitedAt: new Date().toISOString(),
      status: "PENDING",
    };
    setInvites((current) => sortInvitations([...current, invitation]));
    setTab("pending");
  }

  function cancelInvite(invitationId: string) {
    setInvites((current) =>
      current.filter((invitation) => invitation.id !== invitationId),
    );
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
          workspaceName={workspaceName}
          onCancel={cancelInvite}
        />
      </TabPanel>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        workspaceName={workspaceName}
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
