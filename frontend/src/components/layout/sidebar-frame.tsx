"use client";

import { useSyncExternalStore } from "react";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
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
   top strip away with it. */
const ASIDE =
  "hidden h-full w-sidebar shrink-0 overflow-hidden border-r border-border bg-canvas md:block";

/**
 * Places the sidebar at both breakpoints: a static column above `md`, an
 * off-canvas drawer below it. `children` is the server-rendered sidebar, slotted
 * through — this file is a client leaf only because the collapsed preference is
 * `localStorage`, and nothing about the sidebar's contents ships to the browser
 * on its account.
 *
 * Collapsed hides the column outright rather than shrinking it to an icon rail:
 * a 256px sidebar earns its place by showing labels, and half of one is neither.
 */
export function SidebarFrame({ children }: { children: React.ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribeToSidebarCollapsed,
    readSidebarCollapsed,
    getSidebarServerSnapshot,
  );

  return (
    <>
      {/* Kept mounted and hidden rather than unmounted, so collapsing and
          re-opening does not tear the sidebar's subtree down and back up. */}
      <aside className={collapsed ? "hidden" : ASIDE}>{children}</aside>
      <MobileSidebar>{children}</MobileSidebar>
    </>
  );
}
