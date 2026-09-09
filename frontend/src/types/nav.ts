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
  "permissions",
  "backlog",
  "sprint",
  "planning",
  "calendar",
  "desktop",
  "tasks",
  "templates",
  "marketplace",
  "help",
  "trash",
] as const;
export type SidebarIconName = (typeof SIDEBAR_ICONS)[number];

/**
 * One child of a parent nav item. Plain data for the same reason the items are:
 * it crosses the server/client boundary as props.
 *
 * **Two kinds, and they are told apart by which field is set.** Projects' five
 * children are views of ONE page selected by `?view=`; Planning's three are
 * separate routes under one heading. A child sets `param` or `href`, never
 * both — the two answer "which one is current?" differently, and a child
 * claiming both would have two answers.
 */
export type SidebarChildItem = {
  id: string;
  label: string;
  /**
   * The param this child selects, e.g. `{ name: "view", value: "timeline" }`.
   * Absent — on a `param`-style group — marks the page's DEFAULT view, which is
   * written without a param, so that child is current whenever the param is
   * missing or holds a value no sibling claims.
   */
  param?: { name: string; value: string };
  /**
   * A route of its own, for a group whose children are separate pages rather
   * than views of the parent's. Current when it equals the pathname, so the
   * parent's own href plays no part.
   *
   * Absent when the route does not exist yet, exactly as on `SidebarItem`: the
   * child renders disabled rather than as a dead link.
   */
  href?: string;
  /**
   * Marks this child as a route-style one whose destination could not be
   * resolved — no workspace open, no project in the URL. Set alongside a
   * missing `href` so the renderer can tell "not built yet" from "nothing to
   * scope it to", and surfaced as `title`.
   */
  hint?: string;
};

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
   * written down here. Resolved by `resolveHref` to
   * `/workspaces/<id><workspaceSegment>`; disabled when no workspace is open.
   */
  workspaceScoped?: boolean;
  /**
   * Appended to the workspace route for a sub-screen of it — `"/members"`
   * gives `/workspaces/atlas-robotics/members`. Absent means the workspace
   * root itself. Only read when `workspaceScoped`.
   */
  workspaceSegment?: string;
  /** Why the item is unavailable. Surfaced as `title` on a disabled item. */
  hint?: string;
  /**
   * The sub-views of this item's page. Present renders the item as a
   * collapsible group — a disclosure over the same links the page's view strip
   * carries — instead of a single link.
   */
  children?: readonly SidebarChildItem[];
};

export type SidebarSection = {
  id: string;
  label: string;
  items: readonly SidebarItem[];
};
