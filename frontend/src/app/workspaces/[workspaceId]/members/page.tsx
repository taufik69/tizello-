import { notFound } from "next/navigation";
import { MembersPageHeader } from "@/components/members/members-page-header";
import { MembersPanel } from "@/components/members/members-panel";
import { getCurrentUser, getWorkspace } from "@/lib/demo-data";
import { getPendingInvitations } from "@/lib/demo-invites";
import { getWorkspaceMembers } from "@/lib/demo-members";

export async function generateMetadata({
  params,
}: PageProps<"/workspaces/[workspaceId]/members">) {
  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    return {
      title: "Workspace not found",
      description:
        "This workspace does not exist, or it is no longer shared with you.",
    };
  }

  return {
    title: `Members · ${workspace.name}`,
    description: `Everyone with access to ${workspace.name}, and what each of them can change.`,
  };
}

export default async function MembersPage({
  params,
}: PageProps<"/workspaces/[workspaceId]/members">) {
  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) notFound();

  /* All three reads happen on the server and are handed down as plain props.
     Everything below the header is interactive from here on, so `MembersPanel`
     is the client leaf — the header itself ships no JavaScript. */
  const [members, invitations, currentUser] = await Promise.all([
    getWorkspaceMembers(workspaceId),
    getPendingInvitations(workspaceId),
    getCurrentUser(),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <MembersPageHeader workspace={workspace} />
      <MembersPanel
        members={members}
        invitations={invitations}
        currentUserId={currentUser.id}
        workspaceName={workspace.name}
      />
    </main>
  );
}
