import Link from "next/link";
import {
  PROJECT_VIEW_LABEL,
  PROJECT_VIEW_TAB,
  projectsHref,
} from "@/lib/project-view";
import { PROJECT_VIEWS, type ProjectView } from "@/types/project";

/*
 * NAVIGATION, not a tabs widget.
 *
 * Switching a view changes the URL, so each of these is a real `<a>` inside a
 * `<nav>`, and the current one carries `aria-current="page"`. Deliberately NOT
 * `role="tablist"` / `role="tab"`, and deliberately not `ui/tabs.tsx`: that
 * primitive is for co-located panels in one document, and `role="tab"` on a
 * link that navigates tells a screen-reader user the page will not move when
 * it is about to.
 *
 * The payoff is that all five views stay server-rendered with zero client JS
 * for the switch, and every view is linkable, bookmarkable and back-buttonable.
 *
 * The visible label is short; `aria-label` gives the full one ("Status" →
 * "Status breakdown"). The visible text opens the accessible name, so
 * voice control still matches on what is on screen.
 */
const ACTIVE =
  "inline-block border-b-2 border-brand-500 px-2 pb-1.5 text-xs font-semibold text-text";
const IDLE =
  "inline-block border-b-2 border-transparent px-2 pb-1.5 text-xs font-medium text-text-muted transition-colors duration-100 ease-standard hover:border-border-strong hover:text-text";

export function ProjectsViewNav({
  workspaceId,
  view,
}: {
  workspaceId: string;
  view: ProjectView;
}) {
  return (
    <nav aria-label="Project views" className="min-w-0">
      <ul className="scrollbar-board flex items-center gap-1 overflow-x-auto">
        {PROJECT_VIEWS.map((value) => {
          const current = value === view;
          return (
            <li key={value}>
              <Link
                href={projectsHref(workspaceId, value)}
                aria-current={current ? "page" : undefined}
                aria-label={PROJECT_VIEW_LABEL[value]}
                className={current ? ACTIVE : IDLE}
              >
                {PROJECT_VIEW_TAB[value]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
