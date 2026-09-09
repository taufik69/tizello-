"use client";

import { useSyncExternalStore } from "react";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { SidebarCollapsedContext } from "@/components/layout/sidebar-collapsed";
import { cn } from "@/lib/cn";
import {
  getSidebarServerSnapshot,
  readSidebarCollapsed,
  subscribeToSidebarCollapsed,
} from "@/lib/sidebar";

/*
 * `bg-canvas` against the content column's `bg-surface`, split by a hairline:
 * grey against white in light, and the darker of the two neutrals against the
 * default surface in dark.
 */
/* `h-full overflow-hidden` rather than letting the column take its height from
   its contents: the nav inside it owns the scrolling (`SidebarNav`), and an
   aside that grows with a long nav would push the shell's own height past the
   viewport — which is what puts a scrollbar on the document and carries the
   top strip away with it.
   
   `transition-[width]` is what makes collapsing a slide rather than a jump.
   Width is not a compositable property, so this repaints the column on every
   frame — acceptable for one 200ms transition on a 56px-wide box, and the
   alternative (a transform, which IS compositable) would slide the column out
   from under the content rather than making room, since the content column is
   a flex sibling sized by what is left. */
const ASIDE =
  "hidden h-full shrink-0 overflow-hidden border-r border-border bg-canvas transition-[width] duration-200 ease-standard motion-reduce:transition-none md:block";

/**
 * Places the sidebar at both breakpoints: a static column above `md`, an
 * off-canvas drawer below it.
 *
 * COLLAPSED IS AN ICON RAIL, not a hidden column. It used to hide outright, on
 * the argument that half a sidebar is neither one thing nor the other — but
 * that made collapsing a trade of all navigation for some width, and put the
 * only way back in the top strip rather than where the sidebar was. A 56px
 * rail keeps every destination one click away and gives the toggle somewhere
 * to live.
 *
 * `children` is the server-rendered sidebar, slotted through TWICE — once into
 * the desktop column and once into the mobile drawer — and the collapsed flag
 * reaches it through context rather than a prop. The desktop column provides
 * the live value; the drawer provides nothing, so it takes the context's
 * `false` default, because an off-canvas drawer that opened as a rail would be
 * 56px of icons over a scrim. `sidebar-collapsed.ts` records why a render prop
 * and a pair of pre-rendered trees were both wrong.
 */
export function SidebarFrame({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    readSidebarCollapsed,
    getSidebarServerSnapshot,
  );

  return (
    <>
      <aside
        className={cn(ASIDE, collapsed ? "w-rail" : "w-sidebar")}
        data-collapsed={collapsed || undefined}
      >
        {/* The inner box is held at the TARGET width while the aside animates
            to it, so the nav never reflows mid-transition: collapsing clips a
            56px tree out of a shrinking window instead of squeezing a 256px
            one, and expanding reveals the wide tree rather than stretching a
            narrow one. `overflow-hidden` on the aside is what makes that a
            reveal rather than an overflow. */}
        <div className={cn("h-full", collapsed ? "w-rail" : "w-sidebar")}>
          <SidebarCollapsedContext.Provider value={collapsed}>
            {children}
          </SidebarCollapsedContext.Provider>
        </div>
      </aside>

      <MobileSidebar>{children}</MobileSidebar>
    </>
  );
}
