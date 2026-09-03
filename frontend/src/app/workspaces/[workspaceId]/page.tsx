import { notFound } from "next/navigation";
import { ProjectGrid } from "@/components/workspace/project-grid";
import { WorkspaceDetailHeader } from "@/components/workspace/workspace-detail-header";
import { getWorkspace } from "@/lib/demo-data";
import { plural } from "@/lib/plural";

export async function generateMetadata({
  params,
}: PageProps<"/workspaces/[workspaceId]">) {
  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId);

  if (!workspace) {
    return {
      title: "Workspace not found",
      description: "This workspace does not exist, or it is no longer shared with you.",
    };
  }

  return {
    title: workspace.name,
    description: `${plural(workspace.projects.length, "project", "projects")} in ${workspace.name}.`,
  };
}

export default async function WorkspacePage({
  params,
}: PageProps<"/workspaces/[workspaceId]">) {
  const { workspaceId } = await params;
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <WorkspaceDetailHeader workspace={workspace} />
      <ProjectGrid
        projects={workspace.projects}
        workspaceName={workspace.name}
      />
    </main>
  );
}
