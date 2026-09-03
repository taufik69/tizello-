import { AppSidebar } from "@/components/layout/app-sidebar";
import { ContentStrip } from "@/components/layout/content-strip";
import { SidebarFrame } from "@/components/layout/sidebar-frame";

/**
 * The application shell: a persistent left sidebar and a content column.
 *
 * Applied through `layout.tsx` — one under `/workspaces`, one under `/board` —
 * rather than rendered by each page, so navigating between the two routes never
 * tears the sidebar down. `(auth)` has its own split shell and is not wrapped
 * by this one; neither is `/`, the design-system reference.
 *
 * Everything here is a Server Component. The only parts that ship JavaScript
 * are the collapse frame, the nav list and the small controls in the strip.
 *
 * The root is `h-dvh` and does NOT clip: the workspace switcher's menu has to
 * escape the sidebar's width. Scrolling is delegated — the nav has its own
 * region inside the sidebar, and the content column has the one below.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <SidebarFrame>
        <AppSidebar />
      </SidebarFrame>

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <ContentStrip />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
