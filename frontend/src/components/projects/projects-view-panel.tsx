import { ActiveView } from "@/components/projects/active-view";
import { AllView } from "@/components/projects/all-view";
import { BoardView } from "@/components/projects/board-view";
import { StatusView } from "@/components/projects/status-view";
import { TimelineView } from "@/components/projects/timeline-view";
import { PROJECT_VIEW_LABEL, PROJECT_VIEW_SUMMARY } from "@/lib/project-view";
import type { ProjectRecord, ProjectView } from "@/types/project";

/*
 * Picks the view. A switch rather than a lookup object so TypeScript checks
 * exhaustiveness for us — adding a sixth view to `PROJECT_VIEWS` without a
 * branch here is a build error, not a blank screen.
 *
 * The `<h2>` is visually hidden: the tab strip already names the current view
 * on screen, and repeating it would be noise. It is here so the heading order
 * descends from the page's `<h1>` to the `<h3>`s each view renders.
 */
export function ProjectsViewPanel({
  view,
  projects,
  currentUserId,
  today,
}: {
  view: ProjectView;
  projects: ProjectRecord[];
  currentUserId: string;
  today: string;
}) {
  return (
    <section className="mt-3">
      <h2 className="sr-only">
        {PROJECT_VIEW_LABEL[view]} &mdash; {PROJECT_VIEW_SUMMARY[view]}
      </h2>
      {renderView(view, projects, currentUserId, today)}
    </section>
  );
}

function renderView(
  view: ProjectView,
  projects: ProjectRecord[],
  currentUserId: string,
  today: string,
) {
  switch (view) {
    case "timeline":
      return <TimelineView projects={projects} today={today} />;
    case "board":
      return <BoardView projects={projects} />;
    case "all":
      return <AllView projects={projects} currentUserId={currentUserId} />;
    case "status":
      return <StatusView projects={projects} />;
    case "active":
      return <ActiveView projects={projects} currentUserId={currentUserId} />;
  }
}
