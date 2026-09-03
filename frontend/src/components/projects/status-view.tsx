import { ProjectsEmpty } from "@/components/projects/projects-empty";
import { StatusDonut } from "@/components/projects/status-donut";
import { StatusLegend } from "@/components/projects/status-legend";
import { breakdownLabel, statusBreakdown } from "@/lib/status-breakdown";
import { plural } from "@/lib/plural";
import type { ProjectRecord } from "@/types/project";

/**
 * The ring, the total, and the legend that carries the same numbers as text.
 * Stacked below `sm` so the donut never sits beside a squeezed legend at
 * 360px; side by side from `sm` up.
 */
export function StatusView({ projects }: { projects: ProjectRecord[] }) {
  if (projects.length === 0) {
    return (
      <ProjectsEmpty message="There is nothing to break down until a project exists." />
    );
  }

  const slices = statusBreakdown(projects);

  return (
    <section className="rounded-md border border-border bg-surface p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-text">
        {plural(projects.length, "project", "projects")} by status
      </h3>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
        <StatusDonut
          slices={slices}
          total={projects.length}
          label={breakdownLabel(slices, projects.length)}
        />
        <StatusLegend slices={slices} />
      </div>
    </section>
  );
}
