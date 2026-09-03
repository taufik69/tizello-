import { ProjectsEmpty } from "@/components/projects/projects-empty";
import { TimelineGrid } from "@/components/projects/timeline-grid";
import { TimelineGroup } from "@/components/projects/timeline-group";
import { TimelineNav } from "@/components/projects/timeline-nav";
import { TimelineScale } from "@/components/projects/timeline-scale";
import { groupByPhase } from "@/lib/project-groups";
import { timelineWindow } from "@/lib/timeline";
import type { ProjectRecord } from "@/types/project";

/*
 * The gantt: a four-month window opening one month before the pinned today.
 *
 * The window is derived from `today`, which the page passes down from
 * `DEMO_TODAY`. Nothing in this subtree calls `new Date()` with no argument —
 * a "now" evaluated during render is a different instant on the server than at
 * hydration, so the Today marker would jump and React would throw the node
 * away. Pinning it makes every offset a pure function of a string.
 *
 * Rows group by PHASE rather than by status: six lanes for six statuses would
 * put one project in most of them, and the chart would read as a list. The
 * mapping in `project-groups.ts` is total, so nothing falls off.
 *
 * `min-w-3xl` on the inner track is what makes the whole chart scroll as one
 * piece inside its own container, rather than compressing four months into
 * 360px or taking the page sideways with it.
 */
export function TimelineView({
  projects,
  today,
}: {
  projects: ProjectRecord[];
  today: string;
}) {
  if (projects.length === 0) return <ProjectsEmpty />;

  const window = timelineWindow(today);
  const groups = groupByPhase(projects);

  return (
    <div>
      <div className="flex justify-end pb-2">
        <TimelineNav rangeLabel={window.rangeLabel} />
      </div>

      <div className="scrollbar-board overflow-x-auto">
        <div className="min-w-3xl">
          <TimelineScale window={window} />
          <div className="relative">
            <TimelineGrid window={window} />
            {groups.map((group) => (
              <TimelineGroup
                key={group.phase}
                group={group}
                window={window}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
