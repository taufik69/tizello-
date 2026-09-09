import { SidebarHeader } from "@/components/layout/sidebar-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarWorkspace } from "@/components/layout/sidebar-workspace";
import { PRIMARY_ITEMS, SIDEBAR_SECTIONS } from "@/lib/nav-links";

/**
 * The sidebar's contents: pinned switcher, scrolling nav.
 *
 * COLLAPSED drops the switcher and the labels and keeps the icons. The
 * workspace switcher goes rather than shrinking to its glyph, because its menu
 * is the one control here that needs a name to be usable — a 32px square that
 * opens a list of workspaces is a guess. The toggle stays, so the way back is
 * where the way out was.
 *
 * The account row that used to be pinned here (`SidebarAccount`) moved to
 * `ContentStrip`, beside `ThemeToggle` — see `AccountMenu`.
 *
 * A Server Component, and synchronous — the switcher sits behind its own
 * `<Suspense>` so the frame paints immediately. It knows nothing about where
 * it is rendered; `SidebarFrame` places it in the desktop column and in the
 * mobile drawer alike.
 */
export function AppSidebar() {
  return (
    <div className="flex h-full w-full flex-col">
      {/* The switcher is slotted INTO the header rather than rendered by it:
          `SidebarHeader` is a client leaf (it reads the collapsed context) and
          this subtree is async, so passing it as children is what keeps the
          `GET /workspaces` on the server. The header owns the `<Suspense>`
          too — its fallback has to be rail-shaped or row-shaped, and only the
          header knows which. */}
      <SidebarHeader>
        <SidebarWorkspace />
      </SidebarHeader>

      <SidebarNav primary={PRIMARY_ITEMS} sections={SIDEBAR_SECTIONS} />
    </div>
  );
}
