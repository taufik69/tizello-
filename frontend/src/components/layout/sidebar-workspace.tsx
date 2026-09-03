import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { getWorkspaces } from "@/lib/demo-data";

/**
 * The async seam between the sidebar and the switcher. It exists so `AppSidebar`
 * — and therefore the layouts and pages above it — stay synchronous and can put
 * this behind `<Suspense>`. Without it every route's `loading.tsx` would wait on
 * this fetch before the shell painted at all.
 */
export async function SidebarWorkspace() {
  const workspaces = await getWorkspaces();

  return (
    <div className="min-w-0 flex-1">
      <WorkspaceSwitcher workspaces={workspaces} />
    </div>
  );
}
