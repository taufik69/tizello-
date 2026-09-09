import { CreateWorkspaceCard } from "@/components/workspace/create-workspace-card";
import { WorkspaceCard } from "@/components/workspace/workspace-card";
import type { Workspace } from "@/types/workspace";

/**
 * Feature 2's box view. One column at 360px, two from `sm`, three from `lg`.
 *
 * The create tile is the last cell rather than a floating button, so the grid
 * always has a next step in it — including when the list is empty. It is the
 * one thing the archived view drops: "create a workspace" is not the next step
 * when someone is looking through what they have put away, and a new workspace
 * would not appear in the list they are looking at.
 */
export function WorkspaceGrid({
  workspaces,
  archived = false,
}: {
  workspaces: Workspace[];
  archived?: boolean;
}) {
  if (archived && workspaces.length === 0) {
    return (
      <section className="mt-4 rounded-md border border-dashed border-border px-6 py-12 text-center">
        <h2 className="text-sm font-semibold text-text">Nothing archived</h2>
        <p className="mt-1 text-sm text-text-muted">
          Archiving a workspace hides it from your list without deleting
          anything. Archived ones show up here.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4">
      <h2 className="sr-only">
        {archived ? "Your archived workspaces" : "Your workspaces"}
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <li key={workspace.id}>
            <WorkspaceCard workspace={workspace} />
          </li>
        ))}
        {!archived && (
          <li>
            <CreateWorkspaceCard />
          </li>
        )}
      </ul>
    </section>
  );
}
