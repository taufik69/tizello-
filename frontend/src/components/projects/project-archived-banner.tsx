import { canWriteProject } from "@/lib/project-roles";
import type { ProjectRole } from "@/types/project";
import type { WorkspaceRole } from "@/types/workspace";

/**
 * Why the project someone has open looks normal but is not in their list.
 *
 * Archived is a quiet state, not an error, so this is a `warning`-tinted strip
 * rather than a blocking screen — everything below it still works. The restore
 * itself is not a second button here: it lives in the actions menu at the top
 * of the page, one confirm away, and two restore controls on one screen is two
 * places to keep the confirmation copy in step.
 *
 * Neutral ink on the tinted fill, per DESIGN-SYSTEM.md's contrast table —
 * `text-warning` on `bg-warning-subtle` is 3.27:1 in light and fails AA.
 */
export function ProjectArchivedBanner({
  workspaceRole,
  viewerRole,
}: {
  workspaceRole: WorkspaceRole;
  viewerRole: ProjectRole | null;
}) {
  return (
    <p
      role="status"
      className="mt-6 rounded-sm bg-warning-subtle px-3 py-2 text-xs text-text-muted"
    >
      This project is archived. It stays out of the project list until it is
      restored
      {canWriteProject(workspaceRole, viewerRole)
        ? " — use Restore project in the actions menu above."
        : ". Its owner, a manager, or a workspace admin can restore it."}
    </p>
  );
}
