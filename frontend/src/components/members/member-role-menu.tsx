"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import { RoleBadge } from "@/components/workspace/role-badge";
import { WORKSPACE_ROLES, type WorkspaceRole } from "@/types/workspace";

const TRIGGER = buttonVariants({
  variant: "outline",
  size: "sm",
  className: "gap-1.5",
});

/* The locked chip is written out rather than passed through `buttonVariants`:
   the outline variant's `hover:bg-surface-hover` would light the control up as
   if it were usable, and adding a second `hover:bg-*` to cancel it would leave
   the winner to the stylesheet's order. Everything here is a property
   `buttonVariants` would have set, so the two chips still measure the same. */
const LOCKED_TRIGGER =
  "h-7 gap-1.5 rounded-sm border border-border bg-surface px-2 text-xs whitespace-nowrap text-text";

const OWNER_LOCK = "The workspace owner's role can't be changed here.";

/**
 * The role chip doubles as the menu trigger, so a row never shows the same
 * value twice. Owner is listed but not selectable — handing over a workspace
 * is a transfer, not a role edit, and there is no screen for it yet.
 */
export function MemberRoleMenu({
  memberName,
  role,
  locked,
  onRoleChange,
}: {
  memberName: string;
  role: WorkspaceRole;
  /** True on the owner's row. */
  locked: boolean;
  onRoleChange: (role: WorkspaceRole) => void;
}) {
  if (locked) {
    return (
      <LockedControl
        reason={OWNER_LOCK}
        label={`Role for ${memberName}: Owner`}
        className={LOCKED_TRIGGER}
      >
        <RoleBadge role={role} />
        <ChevronDownIcon className="size-3.5 shrink-0" />
      </LockedControl>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Change role for ${memberName}`}
        className={TRIGGER}
      >
        <RoleBadge role={role} />
        <ChevronDownIcon className="size-3.5 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Role</DropdownMenuLabel>
        {WORKSPACE_ROLES.map((option) => (
          <DropdownMenuItem
            key={option}
            disabled={option === "OWNER"}
            aria-current={option === role ? "true" : undefined}
            onSelect={() => onRoleChange(option)}
          >
            <RoleBadge role={option} />
            {option === "OWNER" ? (
              <span className="ml-auto text-2xs text-text-subtle">
                Transfer unavailable
              </span>
            ) : (
              option === role && <CheckIcon className="ml-auto size-3.5" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
