import { WORKSPACE_VIEWS, type WorkspaceView } from "@/types/workspace";

/*
 * The `/workspaces` query string: `?view=` (how the list is drawn) and
 * `?archived=1` (whether archived workspaces are in it).
 *
 * Both are NAVIGATION, not widget state, for the same reason the five project
 * views are (`lib/project-view.ts`): switching either changes the URL, so each
 * control is a real `<a>`, the page stays server-rendered, and "my archived
 * workspaces as a table" is a link somebody can bookmark.
 *
 * `archived` also has to be a URL param rather than a client filter: the API
 * excludes archived rows unless `includeArchived=true` is sent, so the choice
 * has to reach the server fetch, not a `.filter()` in the browser.
 */

export const WORKSPACE_VIEW_LABEL: Record<WorkspaceView, string> = {
  grid: "Board",
  list: "List",
};

export const WORKSPACE_VIEW_SUMMARY: Record<WorkspaceView, string> = {
  grid: "Every workspace as a card.",
  list: "Every workspace as a row, with its role, status and dates.",
};

/** Written WITHOUT the param, so it is current whenever `?view=` is absent. */
export const DEFAULT_WORKSPACE_VIEW: WorkspaceView = "grid";

/** The value `?archived=` has to carry to include archived workspaces. */
const ARCHIVED_ON = "1";

/**
 * `searchParams` values are `string | string[] | undefined`, and a URL can
 * carry anything — `?view=list&view=grid`, `?view=`, `?view=%00`. All of it
 * resolves to the default rather than throwing: a junk query string is a typo,
 * not a 500.
 */
export function parseWorkspaceView(
  raw: string | string[] | undefined,
): WorkspaceView {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return WORKSPACE_VIEWS.find((view) => view === value) ?? DEFAULT_WORKSPACE_VIEW;
}

/** Anything but the literal `"1"` is off — including `"true"`, which no link here ever writes. */
export function parseArchivedFilter(raw: string | string[] | undefined): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === ARCHIVED_ON;
}

/**
 * Builds `/workspaces` back from the two params. Defaults are written as
 * absences, so the grid-without-archived URL is the bare path — that is what
 * lets the sidebar's Home link and this nav's first link be the same URL, and
 * therefore lets exactly one of them be `aria-current`.
 */
export function workspacesHref({
  view = DEFAULT_WORKSPACE_VIEW,
  archived = false,
}: {
  view?: WorkspaceView;
  archived?: boolean;
} = {}): string {
  const params = new URLSearchParams();
  if (view !== DEFAULT_WORKSPACE_VIEW) params.set("view", view);
  if (archived) params.set("archived", ARCHIVED_ON);

  const query = params.toString();
  return query ? `/workspaces?${query}` : "/workspaces";
}
