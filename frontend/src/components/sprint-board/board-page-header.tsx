import { SprintStateBadge } from "@/components/sprints/sprint-state-badge";
import { SprintWindow } from "@/components/sprints/sprint-window";
import { SprintIcon } from "@/components/ui/nav-icons";
import type { ProjectRecord } from "@/types/project";
import type { SprintRecord } from "@/types/sprint";

/**
 * The board's identity: whose project it is, which sprint is running, how long
 * it has left, and what the sprint is for.
 *
 * All server-rendered — none of it changes as cards are dragged, so none of it
 * ships JavaScript. The live counts and every control sit on the toolbar below,
 * which does: each of them reads state this header would have to be dragged
 * across the boundary to see.
 *
 * `SprintWindow` and `SprintStateBadge` are the sprints screen's own, so a
 * sprint reads the same here as it does in the list it was created in.
 */
export function BoardPageHeader({
  project,
  sprint,
  today,
}: {
  project: ProjectRecord;
  sprint: SprintRecord;
  /** The app's pinned today. See the note in `demo-projects.ts`. */
  today: string;
}) {
  return (
    <header className="px-4 pt-4 pb-3">
      <p className="text-2xs font-medium text-text-subtle">{project.name}</p>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <h1 className="flex min-w-0 items-center gap-2 text-lg font-semibold tracking-tight text-text">
          <SprintIcon className="size-4 shrink-0 text-text-muted" />
          {sprint.name}
        </h1>
        <SprintStateBadge state={sprint.state} />
      </div>

      <div className="mt-1">
        <SprintWindow sprint={sprint} today={today} />
      </div>

      {sprint.goal && (
        <p className="mt-1 max-w-prose text-xs text-text-subtle">{sprint.goal}</p>
      )}
    </header>
  );
}
