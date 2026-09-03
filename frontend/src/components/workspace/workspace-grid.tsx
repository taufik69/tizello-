import { CreateWorkspaceCard } from "@/components/workspace/create-workspace-card";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import type { Workspace } from "@/types/workspace";

/**
 * One column at 360px, two from `sm`, three from `lg`. The create tile is the
 * last cell rather than a floating button, so the grid always has a next step
 * in it — including when the list is empty.
 */
export function WorkspaceGrid({ workspaces }: { workspaces: Workspace[] }) {
  return (
    <section>
      <h2 className="sr-only">Your workspaces</h2>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <WorkspaceCard workspace={workspace} />
          </li>
        ))}
        <li>
          <CreateWorkspaceCard />
        </li>
      </ul>
    </section>
  );
}
