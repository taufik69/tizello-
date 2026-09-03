import type { SidebarItem, SidebarSection } from "@/types/nav";

/*
 * The sidebar's destinations, following the product flow in
 * `.claude/plan/applicaton-flow.md`:
 *
 *   Workspace → Members → Projects → Backlog → Sprint → Sprint planning
 *   → Columns → Sprint board → Tasks
 *
 * Only `/workspaces`, `/workspaces/[workspaceId]`,
 * `/workspaces/[workspaceId]/projects`, `/workspaces/[workspaceId]/members`,
 * `/board/backlog` and `/board/sprint-4` exist. Everything else is listed WITHOUT an `href`, which renders it
 * disabled — the flow stays visible without emitting a dead link.
 */

export const PRIMARY_ITEMS: readonly SidebarItem[] = [
  { id: "home", label: "Home", icon: "home", href: "/workspaces" },
  {
    id: "search",
    label: "Search",
    icon: "search",
    hint: "Search is not built yet",
  },
];

export const SIDEBAR_SECTIONS: readonly SidebarSection[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "projects",
        label: "Projects",
        icon: "projects",
        workspaceScoped: true,
        workspaceSegment: "/projects",
        hint: "Open a workspace to see its projects",
      },
      {
        id: "members",
        label: "Members",
        icon: "members",
        workspaceScoped: true,
        workspaceSegment: "/members",
        hint: "Open a workspace to see its members",
      },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    items: [
      {
        id: "backlog",
        label: "Backlog",
        icon: "backlog",
        href: "/board/backlog",
      },
      {
        id: "sprint-board",
        label: "Sprint board",
        icon: "sprint",
        href: "/board/sprint-4",
      },
      {
        /* Built, but per project: the screen lives at
           `/workspaces/[workspaceId]/projects/[projectId]/sprint-planning`,
           and the sidebar knows a workspace at most — it has no project to
           scope the link to. It stays hint-only until a project is a thing the
           shell can hold, exactly as Backlog and Sprints do. */
        id: "sprint-planning",
        label: "Sprint planning",
        icon: "planning",
        hint: "Open a project to plan its sprint",
      },
    ],
  },
];

/**
 * The workspace id in a path, when the path is a workspace route.
 * `/workspaces/atlas-robotics` → `"atlas-robotics"`; `/workspaces` → undefined.
 */
export function workspaceIdFromPath(pathname: string): string | undefined {
  return /^\/workspaces\/([^/]+)/.exec(pathname)?.[1];
}

/**
 * An item's destination. `undefined` is the signal to render it disabled, which
 * covers both "no route exists yet" and "this item needs an open workspace and
 * there isn't one".
 */
export function resolveHref(
  item: SidebarItem,
  workspaceId?: string,
): string | undefined {
  if (!item.workspaceScoped) return item.href;
  if (!workspaceId) return undefined;
  return `/workspaces/${workspaceId}${item.workspaceSegment ?? ""}`;
}
