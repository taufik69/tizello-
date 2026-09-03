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
 * The theme control sits at the far right, where it was in the old top bar —
 * `ml-auto` on it pushes it there and keeps the breadcrumb hard left, so page
 * actions can be appended alongside it later without moving anything.
 */
export function ContentStrip() {
  return (
    <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-border px-3">
      <MobileSidebarTrigger />
      <SidebarExpandButton />
      <Breadcrumb />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  );
}
