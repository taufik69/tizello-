import { notFound } from "next/navigation";
import { ProjectsPageHeader } from "@/components/projects/projects-page-header";
import { ProjectsToolbar } from "@/components/projects/projects-toolbar";
import { ProjectsViewNav } from "@/components/projects/projects-view-nav";
import { ProjectsViewPanel } from "@/components/projects/projects-view-panel";
import { getWorkspace } from "@/lib/demo-data";
import {
  DEMO_TODAY,
  getProjectsCurrentUser,
  getWorkspaceProjects,
} from "@/lib/demo-projects";
import { parseProjectView, PROJECT_VIEW_LABEL } from "@/lib/project-view";

export async function generateMetadata({
  params,
}: PageProps<"/workspaces/[workspaceId]/projects">) {
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
    title: `Projects · ${workspace.name}`,
    description: `Every project in ${workspace.name}, as a table, a timeline, a board, a flat list or a status breakdown.`,
  };
}

export default async function ProjectsPage({
  params,
  searchParams,
}: PageProps<"/workspaces/[workspaceId]/projects">) {
  /* Both are Promises in Next 16, and both are awaited. `?view=` is validated
     against an `as const` list and falls back to `active` for anything
     unrecognised — a junk query string is a typo, not a 500. */
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const view = parseProjectView(query.view);

  const workspace = await getWorkspace(workspaceId);
  if (!workspace) notFound();

  const [projects, currentUser] = await Promise.all([
    getWorkspaceProjects(workspaceId),
    getProjectsCurrentUser(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <ProjectsPageHeader workspace={workspace} />

      {/* The strip wraps rather than scrolls: at 360px the five view links
          take the first line and the toolbar drops below them. */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-border">
        <ProjectsViewNav workspaceId={workspace.id} view={view} />
        <div className="pb-1.5">
          <ProjectsToolbar />
        </div>
      </div>

      <ProjectsViewPanel
        view={view}
        projects={projects}
        currentUserId={currentUser.id}
        today={DEMO_TODAY}
      />

      <p className="sr-only">
        Showing the {PROJECT_VIEW_LABEL[view]} view.
      </p>
    </main>
  );
}
