import { notFound } from "next/navigation";
import { PermissionsBoard } from "@/components/permissions/permissions-board";
import { PermissionsPageHeader } from "@/components/permissions/permissions-page-header";
import { getCurrentUser, getWorkspace } from "@/lib/demo-data";
import { getWorkspaceMembers } from "@/lib/demo-members";
import {
  getPermissionMatrix,
  getWorkspaceRoles,
} from "@/lib/demo-permissions";

export async function generateMetadata({
  params,
}: PageProps<"/workspaces/[workspaceId]/settings/permissions">) {
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
    title: `Roles & permissions · ${workspace.name}`,
    description: `What each role can do in ${workspace.name}, and who holds which one.`,
  };
}

export default async function PermissionsPage({
  params,
}: PageProps<"/workspaces/[workspaceId]/settings/permissions">) {
  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) notFound();

  /* All four reads happen on the server and travel down as plain props. The
     header ships no JavaScript; everything below it shares one state. */
  const [groups, roles, members, currentUser] = await Promise.all([
    getPermissionMatrix(workspaceId),
    getWorkspaceRoles(workspaceId),
    getWorkspaceMembers(workspaceId),
    getCurrentUser(),
  ]);

  return (
    <main className="w-full px-4 py-8 sm:px-6">
      <PermissionsPageHeader workspace={workspace} />
      <PermissionsBoard
        groups={groups}
        roles={roles}
        members={members}
        currentUserId={currentUser.id}
      />
    </main>
  );
}
