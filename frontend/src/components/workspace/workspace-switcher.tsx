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
import { cn } from "@/lib/cn";
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar";
import { workspaceIdFromPath } from "@/lib/nav-links";
import type { Workspace } from "@/types/workspace";

const BASE =
  "flex items-center rounded-sm text-sm font-medium text-text-muted transition-colors duration-100 ease-standard hover:bg-surface-sunken hover:text-text";
/* Full width: it is the first row of a 256px sidebar, not a chip in a bar. */
const TRIGGER = "w-full min-w-0 gap-2 px-2 py-1.5";
/* A 56px rail has room for the disc and nothing else. */
const COMPACT = "size-8 shrink-0 justify-center";

/**
 * The sidebar's workspace switcher: identity disc, name, chevron, menu.
 *
 * The active workspace comes from the URL rather than from a prop. This is
 * already a client component — the menu needs state — and the alternative was
 * threading an id from a `layout.tsx` that has no `workspaceId` param to give.
 *
 * The workspaces are REAL (`GET /workspaces`, via `SidebarWorkspace`), so the
 * disc reads `icon` and `color` — the two fields someone actually picked —
 * before falling back to the fixture-only `accent`. `WorkspaceSwitchMenu` is
 * the page-level sibling of this control; the difference between them is in
 * that file's header.
 */
export function WorkspaceSwitcher({
  workspaces,
  compact = false,
}: {
  workspaces: Workspace[];
  /**
   * The disc alone, for the collapsed sidebar.
   *
   * The name it drops is not lost: it is already in this trigger's
   * `aria-label`, and `title` puts it in a tooltip — which is what makes a
   * 32px square that opens a list of workspaces something other than a guess.
   * The icon a person picked for their workspace is the most identifying thing
   * on it, so showing that rather than nothing is the better trade.
   */
  compact?: boolean;
}) {
  const activeWorkspaceId = workspaceIdFromPath(usePathname());
  const active = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(BASE, compact ? COMPACT : TRIGGER)}
        title={compact ? (active?.name ?? "Switch workspace") : undefined}
        aria-label={
          active ? `Workspace: ${active.name}. Switch workspace` : "Switch workspace"
        }
      >
        {active ? (
          <WorkspaceAvatar
            name={active.name}
            icon={active.icon}
            color={active.color}
            accent={active.accent}
            size="sm"
          />
        ) : (
          <span className="size-5 rounded-full bg-surface-sunken" aria-hidden="true" />
        )}

        {!compact && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">
              {active ? active.name : "Workspaces"}
            </span>
            <ChevronDownIcon className="size-3 shrink-0" />
          </>
        )}
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
                icon={workspace.icon}
                color={workspace.color}
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
