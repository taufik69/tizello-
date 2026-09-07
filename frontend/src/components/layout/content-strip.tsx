import { Suspense } from "react";
import { AccountMenu } from "@/components/layout/account-menu";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  MobileSidebarTrigger,
  SidebarExpandButton,
} from "@/components/layout/sidebar-buttons";

/**
 * The slim strip above the page. Breadcrumb on the left, behind the two
 * controls that put the sidebar back: the hamburger below `md`, and the expand
 * button above it whenever the sidebar is collapsed.
 *
 * The theme control and the account menu sit at the far right — `ml-auto` on
 * that group pushes both there and keeps the breadcrumb hard left. The
 * account menu used to be `SidebarAccount`, pinned to the sidebar's bottom
 * edge; it moved up here to sit beside the theme control, per the reference
 * layout.
 */
export function ContentStrip() {
  return (
    <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-border px-3">
      <MobileSidebarTrigger />
      <SidebarExpandButton />
      <Breadcrumb />

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <Suspense fallback={<div className="size-8 animate-pulse rounded-full bg-surface-sunken" />}>
          <AccountMenu />
        </Suspense>
      </div>
    </div>
  );
}
