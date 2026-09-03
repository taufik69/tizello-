import { notFound } from "next/navigation";
import { BacklogPageHeader } from "@/components/backlog/backlog-page-header";
import { BacklogPanel } from "@/components/backlog/backlog-panel";
import { getBacklogAssignees, getProjectBacklog } from "@/lib/demo-backlog";
import { getWorkspace } from "@/lib/demo-data";
import { getProject } from "@/lib/demo-projects";

export async function generateMetadata({
  params,
}: PageProps<"/workspaces/[workspaceId]/projects/[projectId]/backlog">) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    return {
      title: "Project not found",
      description:
        "This project does not exist, or it is no longer shared with you.",
    };
  }

  return {
    title: `Backlog · ${project.name}`,
    description: `Everything ${project.name} might do, grouped by priority and not yet committed to a sprint.`,
  };
}

export default async function ProjectBacklogPage({
  params,
}: PageProps<"/workspaces/[workspaceId]/projects/[projectId]/backlog">) {
  /* `params` is a Promise in Next 16, and it is awaited. */
  const { workspaceId, projectId } = await params;

  /* Both reads happen on the server. A missing workspace or a missing project
     is `notFound()`, not an empty shell — a backlog belongs to a project, and
     a page that renders the chrome around nothing is a worse answer than 404. */
  const [workspace, project] = await Promise.all([
    getWorkspace(workspaceId),
    getProject(projectId),
  ]);
  if (!workspace || !project) notFound();

  const [tasks, assignees] = await Promise.all([
    getProjectBacklog(projectId),
    getBacklogAssignees(workspaceId),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <BacklogPageHeader workspaceId={workspace.id} project={project} />

      {/* Everything below the header is interactive, so `BacklogPanel` is the
          client leaf — the header itself ships no JavaScript. */}
      <BacklogPanel tasks={tasks} assignees={assignees} />
    </main>
  );
}
