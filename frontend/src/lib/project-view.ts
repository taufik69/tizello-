import { PROJECT_VIEWS, type ProjectView } from "@/types/project";

/*
 * The `?view=` search param: parsing it, and building the links back.
 *
 * The five views are NAVIGATION, not a tabs widget — switching one changes the
 * URL, so each is a real `<a>` and the current one carries `aria-current`.
 * That is also why all five stay server-rendered: nothing about the switch
 * needs the browser.
 */

export const PROJECT_VIEW_LABEL: Record<ProjectView, string> = {
  active: "Active",
  timeline: "Timeline",
  board: "Board",
  all: "All",
  status: "Status breakdown",
};

/** The short label on the tab strip; the full one is the link's accessible name. */
export const PROJECT_VIEW_TAB: Record<ProjectView, string> = {
  active: "Active",
  timeline: "Timeline",
  board: "Board",
  all: "All",
  status: "Status",
};

export const PROJECT_VIEW_SUMMARY: Record<ProjectView, string> = {
  active: "Everything in flight, grouped by status.",
  timeline: "When each project runs, against the calendar.",
  board: "One column per status.",
  all: "Every project, ungrouped.",
  status: "How the work is distributed across statuses.",
};

const DEFAULT_VIEW: ProjectView = "active";

/**
 * `searchParams` values are `string | string[] | undefined`, and a URL can
 * carry anything at all — `?view=board&view=all`, `?view=%00`, `?view=`. Every
 * one of those resolves to the default rather than throwing: a junk query
 * string is a typo, not a 500.
 */
export function parseProjectView(
  raw: string | string[] | undefined,
): ProjectView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return PROJECT_VIEWS.find((view) => view === value) ?? DEFAULT_VIEW;
}

/**
 * The default view is written WITHOUT the param, so the tab strip's first link
 * and the sidebar's Projects item point at the same URL and only one of them
 * can be `aria-current`.
 */
export function projectsHref(workspaceId: string, view: ProjectView): string {
  const base = `/workspaces/${workspaceId}/projects`;
  return view === DEFAULT_VIEW ? base : `${base}?view=${view}`;
}
