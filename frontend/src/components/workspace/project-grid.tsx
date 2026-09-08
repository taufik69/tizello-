import { NewProjectCard } from "@/components/workspace/new-project-card";
import { ProjectCard } from "@/components/workspace/project-card";
import type { ProjectRecord } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * The workspace detail page's projects. Real rows now, from
 * `GET /workspaces/:id/projects` — archived ones are excluded by the API, so
 * this grid is the active set.
 *
 * The create tile is the last cell rather than a floating button, so the grid
 * always has a next step in it — including when the workspace has no projects
 * yet, which is the case a new workspace opens in.
 */
export function ProjectGrid({
  projects,
  workspaceId,
  workspaceName,
  workspaceRole,
}: {
  projects: ProjectRecord[];
  workspaceId: string;
  workspaceName: string;
  /* The caller's WORKSPACE role — half of the two-layer ladder the actions
     menu needs; the project's own `viewerRole` is the other half. */
  workspaceRole: WorkspaceRole;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold tracking-widest text-text-subtle uppercase">
        Projects
      </h2>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.id}>
            <ProjectCard
              project={project}
              workspaceId={workspaceId}
              workspaceRole={workspaceRole}
            />
          </li>
        ))}
        <li>
          <NewProjectCard workspaceId={workspaceId} workspaceName={workspaceName} />
        </li>
      </ul>
    </section>
  );
}
