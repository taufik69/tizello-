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
import { ROLE_LABEL } from "@/lib/roles";
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

/**
 * The role chip doubles as the menu trigger, so a row never shows the same
 * value twice. Owner is listed but not selectable — handing over a workspace
 * is a transfer, not a role edit, and there is no endpoint for it yet
 * (`backend/docs/api/member.md` open question 3).
 *
 * `lock` is the REASON, not a boolean: the chip is locked on the owner's row, on
 * your own row, and for anyone without `member:role:update`, and a reader told
 * the wrong one of those three goes looking for a permission they already have.
 * `MemberRow` decides which applies.
 */
export function MemberRoleMenu({
  memberName,
  role,
  lock,
  onRoleChange,
}: {
  memberName: string;
  role: WorkspaceRole;
  /** Why this chip is not interactive, or `null` when it is. */
  lock: string | null;
  onRoleChange: (role: WorkspaceRole) => void;
}) {
  if (lock) {
    return (
      <LockedControl
        reason={lock}
        label={`Role for ${memberName}: ${ROLE_LABEL[role]}`}
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
