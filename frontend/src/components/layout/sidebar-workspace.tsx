import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { getWorkspaces } from "@/lib/workspaces";

/**
 * The async seam between the sidebar and the switcher. It exists so `AppSidebar`
 * — and therefore the layouts and pages above it — stay synchronous and can put
 * this behind `<Suspense>`. Without it every route's `loading.tsx` would wait on
 * this fetch before the shell painted at all.
 *
 * `GET /workspaces`, not `demo-data.ts`: the switcher's ids have to be the ids
 * `/workspaces/[workspaceId]` resolves, or every switch lands on a not-found.
 * Archived workspaces are left out — the sidebar is for the ones in play, and
 * `/workspaces?archived=1` is where the rest live.
 */
export async function SidebarWorkspace() {
  const workspaces = await getWorkspaces();

  return (
    <div className="min-w-0 flex-1">
      <WorkspaceSwitcher workspaces={workspaces} />
    </div>
  );
}
