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
 * The three entries are deliberately inert: none of them has a screen or a
 * mutation behind it yet, and wiring one would mean inventing an API.
 */
export function WorkspaceSettingsMenu({ workspaceName }: { workspaceName: string }) {
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
        <DropdownMenuItem disabled>Manage members</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Leave workspace</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
