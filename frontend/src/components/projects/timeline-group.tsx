import { NewProjectTrigger } from "@/components/projects/new-project-trigger";
import { PHASE_DOT } from "@/components/projects/project-tone";
import { TimelineRow } from "@/components/projects/timeline-row";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { PHASE_LABEL, type PhaseGroup } from "@/lib/project-groups";
import type { TimelineWindow } from "@/lib/timeline";

/**
 * One lane of the gantt. The chevron is decoration — collapsing is not built,
 * and a control that looks pressable and does nothing is worse than none.
 */
export function TimelineGroup({
  group,
  window,
}: {
  group: PhaseGroup;
  window: TimelineWindow;
}) {
  const headingId = `timeline-group-${group.phase}`;
  const label = PHASE_LABEL[group.phase];

  return (
    <section aria-labelledby={headingId} className="relative">
      <div className="flex items-center gap-1.5 border-b border-border px-0.5 py-2">
        <ChevronDownIcon className="size-3.5 shrink-0 text-text-subtle" />
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", PHASE_DOT[group.phase])}
        />
        <h3 id={headingId} className="text-xs font-semibold text-text">
          {label}
        </h3>
        <span className="text-2xs tabular-nums text-text-subtle">
          {group.projects.length}
        </span>
      </div>

      {group.projects.length > 0 && (
        <ul>
          {group.projects.map((project) => (
            <TimelineRow key={project.id} project={project} window={window} />
          ))}
        </ul>
      )}

      <div className="w-52 py-1">
        <NewProjectTrigger label={`New project in ${label}`} />
      </div>
    </section>
  );
}
