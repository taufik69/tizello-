import { SettingsIcon } from "@/components/ui/icons";
import { CreateProjectButton } from "@/components/projects/create-project-button";
import { LockedControl } from "@/components/ui/locked-control";
import { SearchIcon } from "@/components/ui/nav-icons";
import { FilterIcon, SortIcon } from "@/components/ui/table-icons";

/*
 * The right-aligned controls above every view.
 *
 * The four on the left do not work, and each is a `LockedControl` rather than
 * a `<button>` with no handler: the reason travels as a tooltip, as the tail
 * of the accessible name and as the dim, and inertness is the contract rather
 * than something the next caller has to remember.
 *
 * New is the exception and no longer locked: `POST /workspaces/:id/projects`
 * exists, so it is a real button in its own client leaf. Everything beside it
 * is still inert because no endpoint backs it — filtering and search would
 * mean `?status=` / `?q=` round trips this toolbar does not build yet, even
 * though `lib/projects.ts` already accepts both.
 */
const ICON = "size-7 rounded-sm text-text-muted";

export function ProjectsToolbar({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <LockedControl
        reason="Filtering is not built yet"
        label="Filter projects"
        className={ICON}
      >
        <FilterIcon className="size-3.5" />
      </LockedControl>

      <LockedControl
        reason="Sorting is not built yet"
        label="Sort projects"
        className={ICON}
      >
        <SortIcon className="size-3.5" />
      </LockedControl>

      <LockedControl
        reason="Search is not built yet"
        label="Search projects"
        className={ICON}
      >
        <SearchIcon className="size-3.5" />
      </LockedControl>

      <LockedControl
        reason="View settings are not built yet"
        label="View settings"
        className={ICON}
      >
        <SettingsIcon className="size-3.5" />
      </LockedControl>

      <CreateProjectButton workspaceId={workspaceId} workspaceName={workspaceName} />
    </div>
  );
}
