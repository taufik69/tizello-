import { Suspense } from "react";
import {
  MobileSidebarClose,
  SidebarCollapseButton,
} from "@/components/layout/sidebar-buttons";
import { SidebarAccount } from "@/components/layout/sidebar-account";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarWorkspace } from "@/components/layout/sidebar-workspace";
import { PRIMARY_ITEMS, SIDEBAR_SECTIONS } from "@/lib/nav-links";

/**
 * The sidebar's contents: pinned switcher, scrolling nav, pinned account row.
 *
 * A Server Component, and synchronous — the two parts that need data sit behind
 * their own `<Suspense>` so the frame paints immediately. It knows nothing about
 * where it is rendered; `SidebarFrame` places it in the desktop column and in
 * the mobile drawer alike.
 */
export function AppSidebar() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-1 p-2">
        <Suspense
          fallback={
            <div className="h-8 flex-1 animate-pulse rounded-sm bg-surface-sunken" />
          }
        >
          <SidebarWorkspace />
        </Suspense>

        {/* Mutually exclusive by breakpoint: collapse above `md`, close below,
            and below `md` this header only ever renders inside the drawer. */}
        <SidebarCollapseButton />
        <MobileSidebarClose />
      </div>

      <SidebarNav primary={PRIMARY_ITEMS} sections={SIDEBAR_SECTIONS} />

      <Suspense
        fallback={<div className="h-28 shrink-0 border-t border-border" />}
      >
        <SidebarAccount />
      </Suspense>
    </div>
  );
}
