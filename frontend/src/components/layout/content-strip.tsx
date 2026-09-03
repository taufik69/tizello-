import { Breadcrumb } from "@/components/layout/breadcrumb";
import {
  MobileSidebarTrigger,
  SidebarExpandButton,
} from "@/components/layout/sidebar-buttons";

/**
 * The slim strip above the page. Breadcrumb on the left, behind the two
 * controls that put the sidebar back: the hamburger below `md`, and the expand
 * button above it whenever the sidebar is collapsed.
 *
 * The right-hand side is reserved for page actions and is empty on purpose —
 * no route has one yet, and a disabled button that never becomes enabled is
 * worse than a quiet strip.
 */
export function ContentStrip() {
  return (
    <div className="flex h-topbar shrink-0 items-center gap-2 border-b border-border px-3">
      <MobileSidebarTrigger />
      <SidebarExpandButton />
      <Breadcrumb />
    </div>
  );
}
