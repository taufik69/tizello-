import type { ProjectScope } from "@/components/projects/project-properties";
import { CreateProjectButton } from "@/components/projects/create-project-button";
import { ProjectsDisplayMenu } from "@/components/projects/projects-display-menu";
import { ProjectsFilterMenu } from "@/components/projects/projects-filter-menu";
import { ProjectsSearch } from "@/components/projects/projects-search";
import { ProjectsSortMenu } from "@/components/projects/projects-sort-menu";
import type { ProjectFilters } from "@/lib/project-filters";
import type { ProjectView } from "@/types/project";

/*
 * The right-aligned controls above every view. All four work now.
 *
 * They were `LockedControl`s — present, self-explaining and inert — because no
 * endpoint backed them. Three of the four turned out to be already backed:
 * `GET /workspaces/:id/projects` takes `status`, `priority`, `q` and `mine`
 * (`lib/projects.ts`), so filtering and search are round trips this toolbar
 * simply had not been wired to build. Sorting is the exception and is done
 * client-side, which `lib/project-sort.ts` explains and bounds.
 *
 * THREE OF THESE WRITE THE URL AND ONE WRITES `localStorage`, which is the
 * split worth noticing. Filter, Sort and Search change WHICH projects are on
 * screen, so they belong in a link someone can send; the gear changes how this
 * person's own screen is laid out, which nobody should inherit from a pasted
 * URL. `project-filters.ts` and `project-density.ts` hold the two halves.
 *
 * THIS FILE IS STILL A SERVER COMPONENT. Each control is its own client leaf,
 * so the strip itself ships no JavaScript and the `filters` it hands down are
 * the ones the page already parsed — one parser for one URL.
 */
export function ProjectsToolbar({
  scope,
  view,
  filters,
}: {
  scope: ProjectScope;
  view: ProjectView;
  filters: ProjectFilters;
}) {
  const shared = { workspaceId: scope.workspaceId, view, filters };

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <ProjectsFilterMenu {...shared} />
      <ProjectsSortMenu {...shared} />
      <ProjectsSearch {...shared} />
      <ProjectsDisplayMenu />
      <CreateProjectButton scope={scope} />
    </div>
  );
}
