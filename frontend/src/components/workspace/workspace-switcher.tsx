"use client";

import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { workspaceIdFromPath } from "@/lib/nav-links";
import type { Workspace } from "@/types/workspace";

/* Full width: it is the first row of a 256px sidebar, not a chip in a bar. */
const TRIGGER =
  "flex w-full min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-text";

/**
 * The sidebar's workspace switcher: identity disc, name, chevron, menu.
 *
 * The active workspace comes from the URL rather than from a prop. This is
 * already a client component — the menu needs state — and the alternative was
 * threading an id from a `layout.tsx` that has no `workspaceId` param to give.
 */
export function WorkspaceSwitcher({ workspaces }: { workspaces: Workspace[] }) {
  const activeWorkspaceId = workspaceIdFromPath(usePathname());
  const active = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={TRIGGER}
        aria-label={
          active ? `Workspace: ${active.name}. Switch workspace` : "Switch workspace"
        }
      >
        {active ? (
          <WorkspaceAvatar
            name={active.name}
            accent={active.accent}
            size="sm"
          />
        ) : (
          <span className="size-5 rounded-full bg-surface-sunken" aria-hidden="true" />
        )}
        <span className="min-w-0 flex-1 truncate text-left">
          {active ? active.name : "Workspaces"}
        </span>
        <ChevronDownIcon className="size-3 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>Your workspaces</DropdownMenuLabel>

        {workspaces.map((workspace) => {
          const current = workspace.id === activeWorkspaceId;
          return (
            <DropdownMenuItem
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              aria-current={current ? "page" : undefined}
            >
              <WorkspaceAvatar
                name={workspace.name}
                accent={workspace.accent}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
              {current ? (
                <CheckIcon className="size-3.5 shrink-0 text-text-brand" />
              ) : (
                /* Holds the column open so the names stay aligned. */
                <span className="size-3.5 shrink-0" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <DropdownMenuItem href="/workspaces">
          View all workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
