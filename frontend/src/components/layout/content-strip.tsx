import { Suspense } from "react";
import { AccountMenu } from "@/components/layout/account-menu";
import { PageLabel } from "@/components/layout/page-label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  MobileSidebarTrigger,
  SidebarExpandButton,
} from "@/components/layout/sidebar-buttons";

/**
 * The slim strip above the page. The page label on the left, behind the two
 * controls that put the sidebar back: the hamburger below `md`, and the expand
 * button above it whenever the sidebar is collapsed.
 *
 * The label is orientation only — the breadcrumb proper lives in the content
 * column, as the page's heading. The theme control and the account menu
 * sit at the far right; `ml-auto` on that group is what pushes them there. The
 * account menu used to be `SidebarAccount`, pinned to the sidebar's bottom
 * edge; it moved up here to sit beside the theme control, per the reference
 * layout.
 */
export function ContentStrip() {
  return (
    /* `px-4 sm:px-6` mirrors every `<main>` under this shell, so the strip's
       page label and the page's own heading sit on one vertical line rather
       than 4px apart. */
    <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
      <MobileSidebarTrigger />
      <SidebarExpandButton />
      <PageLabel />

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <Suspense fallback={<div className="size-8 animate-pulse rounded-full bg-surface-sunken" />}>
          <AccountMenu />
        </Suspense>
      </div>
    </div>
  );
}
