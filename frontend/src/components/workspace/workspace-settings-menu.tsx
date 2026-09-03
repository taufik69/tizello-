"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsIcon } from "@/components/ui/icons";

/**
 * The gear on a workspace header. Icon-only, so it carries an `aria-label`.
 *
 * "Manage members" is the one live entry — it navigates to the members screen.
 * The other two stay inert: neither has a screen or a mutation behind it yet,
 * and wiring one would mean inventing an API.
 */
export function WorkspaceSettingsMenu({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Settings for ${workspaceName}`}
        className={buttonVariants({ variant: "ghost", size: "icon" })}
      >
        <SettingsIcon className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuItem disabled>Rename workspace</DropdownMenuItem>
        <DropdownMenuItem href={`/workspaces/${workspaceId}/members`}>
          Manage members
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Leave workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
