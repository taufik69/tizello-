"use client";

import { Suspense } from "react";
import {
  MobileSidebarClose,
  SidebarCollapseButton,
} from "@/components/layout/sidebar-buttons";
import { useSidebarCollapsed } from "@/components/layout/sidebar-collapsed";
import { cn } from "@/lib/cn";

/**
 * The pinned row above the nav: the workspace switcher, and the controls that
 * collapse or close the sidebar.
 *
 * A client leaf so it can read the collapsed context, with the switcher passed
 * in as `children` — that subtree is async and server-rendered
 * (`SidebarWorkspace` awaits `GET /workspaces`), and slotting it through keeps
 * it on the server rather than dragging a fetch across the boundary.
 *
 * The `<Suspense>` boundary is HERE rather than around the switcher upstream,
 * because its fallback has to match the shape it is standing in for and only
 * this component knows which that is: `flex-1` fills the expanded row, and the
 * same class in the stacked rail is a 56px-wide bar stretched down the column.
 *
 * COLLAPSED, THE ROW BECOMES A COLUMN: the toggle on top, the workspace disc
 * under it, both centred in the 56px rail. Stacked rather than side by side
 * because two 32px controls plus their gap is wider than the rail.
 *
 * The switcher survives the collapse as its icon alone. It was dropped
 * entirely at first, on the argument that its menu needs a name to be usable —
 * but the icon a person picked for their workspace is the most identifying
 * thing on it, and the name is still carried by the trigger's `aria-label` and
 * a `title` tooltip. Dropping it left the rail with no sign of which workspace
 * you were in at all, which is worse than a disc you have to hover.
 */
export function SidebarHeader({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarCollapsed();

  return (
    <div
      className={cn(
        "flex shrink-0 gap-1 p-2",
        collapsed ? "flex-col items-center" : "items-center",
      )}
    >
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className={cn(
              "h-8 animate-pulse rounded-sm bg-surface-sunken",
              collapsed ? "w-8" : "flex-1",
            )}
          />
        }
      >
        {children}
      </Suspense>

      {/* Mutually exclusive by breakpoint: the toggle above `md`, close below,
          and below `md` this header only ever renders inside the drawer.
          `order-first` rather than a second copy of the pair: collapsed, the
          toggle belongs at the very top of the rail — where it was in the
          expanded header's top-right corner — and reordering in CSS keeps one
          set of controls with one set of props. */}
      <div className={cn("flex items-center gap-1", collapsed && "order-first")}>
        <SidebarCollapseButton collapsed={collapsed} />
        <MobileSidebarClose />
      </div>
    </div>
  );
}
