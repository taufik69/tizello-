/*
 * The app shell's navigation model. Deliberately plain data — no components, no
 * functions — because it crosses the server/client boundary as props: the nav
 * list needs `usePathname` to mark the active item, so it is a client leaf fed
 * by a Server Component parent.
 *
 * Icons therefore travel as a name, not as a component. `sidebar-icons.tsx`
 * resolves the name to a glyph on the client side of that boundary.
 */

export const SIDEBAR_ICONS = [
  "home",
  "search",
  "projects",
  "members",
  "backlog",
  "sprint",
  "planning",
] as const;
export type SidebarIconName = (typeof SIDEBAR_ICONS)[number];

export type SidebarItem = {
  id: string;
  label: string;
  icon: SidebarIconName;
  /**
   * Absent when the route does not exist yet. The item then renders disabled
   * rather than as a dead link — the same treatment `DropdownMenuItem` gives a
   * disabled entry.
   */
  href?: string;
  /**
   * The destination is the workspace currently in the URL, so it cannot be
   * written down here. Resolved by `resolveHref`; disabled when no workspace is
   * open.
   */
  workspaceScoped?: boolean;
  /** Why the item is unavailable. Surfaced as `title` on a disabled item. */
  hint?: string;
};

export type SidebarSection = {
  id: string;
  label: string;
  items: readonly SidebarItem[];
};
