import Link from "next/link";
import type { Workspace } from "@/types/workspace";

/**
 * The static chrome above the views: the way back, the page's only `<h1>`, and
 * one line saying what the five views have in common. All server-rendered —
 * switching a view is a navigation, so none of this ships JavaScript.
 */
export function ProjectsPageHeader({ workspace }: { workspace: Workspace }) {
  return (
    <header>
      <Link
        href={`/workspaces/${workspace.id}`}
        className="inline-block rounded-xs text-2xs font-medium text-text-subtle transition-colors duration-100 ease-standard hover:text-text-muted"
      >
        ← {workspace.name}
      </Link>

      <h1 className="mt-2 text-xl font-semibold tracking-tight text-text">
        Projects
      </h1>
      <p className="mt-1 max-w-prose text-sm text-text-muted">
        Every project in this workspace, five ways. The views share one set of
        records &mdash; grouping, sorting and the shape on screen are all that
        change between them.
      </p>
    </header>
  );
}
