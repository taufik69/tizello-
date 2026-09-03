import { ChevronDownIcon, SettingsIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { SearchIcon } from "@/components/ui/nav-icons";
import { FilterIcon, SortIcon } from "@/components/ui/table-icons";

/*
 * The right-aligned controls above every view.
 *
 * None of them work, and every one is a `LockedControl` rather than a
 * `<button>` with no handler: the reason travels as a tooltip, as the tail of
 * the accessible name and as the dim, and inertness is the contract rather
 * than something the next caller has to remember.
 *
 * The New button does NOT reuse `buttonVariants`. Those carry `hover:` and
 * `active:` feedback, and a control that lights up under the cursor and then
 * does nothing is a worse lie than a plain dim one. Same tokens, no promise:
 * `bg-brand-500` carries `text-on-brand` at 7.1:1, never white.
 */
const ICON = "size-7 rounded-sm text-text-muted";
const NEW =
  "h-7 gap-1 rounded-sm bg-brand-500 pr-1.5 pl-2 text-xs font-semibold text-on-brand";

export function ProjectsToolbar() {
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

      <LockedControl
        reason="Creating a project is not built yet"
        label="New project"
        className={NEW}
      >
        New
        <ChevronDownIcon className="size-3.5" />
      </LockedControl>
    </div>
  );
}
