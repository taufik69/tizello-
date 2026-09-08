import { notFound } from "next/navigation";
import { ProjectGrid } from "@/components/workspace/project-grid";
import { WorkspaceArchivedBanner } from "@/components/workspace/workspace-archived-banner";
import { WorkspaceDetailFacts } from "@/components/workspace/workspace-detail-facts";
import { WorkspaceDetailHeader } from "@/components/workspace/workspace-detail-header";
import { getWorkspace, getWorkspaces } from "@/lib/workspaces";

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
    description:
      workspace.description ?? `The projects, members and settings of ${workspace.name}.`,
  };
}

/**
 * Feature 1 — one workspace, read from `GET /workspaces/:id` rather than from
 * `demo-data.ts`.
 *
 * `getWorkspace` answers `null` for a workspace that does not exist, one that
 * has been soft-deleted, and one the caller is not a member of — the API
 * collapses all three into the same `404` deliberately, so that nobody can
 * probe for the existence of a workspace they cannot see. `notFound()` renders
 * this segment's `not-found.tsx` for all three.
 *
 * The workspace list alongside it is what the header's Switch menu needs
 * (feature 5), and it is fetched here rather than inside that menu so the whole
 * header stays a Server Component. `includeArchived` is on: an archived
 * workspace you are currently looking at has to appear in its own switcher.
 */
export default async function WorkspacePage({
  params,
}: PageProps<"/workspaces/[workspaceId]">) {
  const { workspaceId } = await params;

  const [workspace, workspaces] = await Promise.all([
    getWorkspace(workspaceId),
    getWorkspaces({ includeArchived: true }),
  ]);
  if (!workspace) notFound();

  return (
    <main className="w-full px-4 py-8 sm:px-6">
      <WorkspaceDetailHeader workspace={workspace} workspaces={workspaces} />

      {workspace.isArchived && <WorkspaceArchivedBanner role={workspace.role} />}

      <WorkspaceDetailFacts workspace={workspace} />

      {/* Still fixture-shaped: there is no project module on the API, so a
          real workspace carries no `projects` and this renders the create tile
          alone. It stays on the page because the grid is where projects will
          land — see the Projects row in CLAUDE.md's build progress. */}
      <ProjectGrid
        projects={workspace.projects ?? []}
        workspaceName={workspace.name}
      />
    </main>
  );
}
