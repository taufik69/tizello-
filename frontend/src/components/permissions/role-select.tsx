"use client";

import { RoleChip } from "@/components/permissions/role-chip";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";
import type { RoleDefinition } from "@/types/permissions";

/*
 * `MemberRoleMenu` for an open-ended role list. The roster's version is keyed
 * on the `WorkspaceRole` union and cannot offer a role this workspace invented,
 * so this one takes the list as a prop and is otherwise the same control —
 * same trigger geometry, same locked chip, same "the chip IS the trigger" so a
 * row never shows its role twice.
 */
const TRIGGER = buttonVariants({
  variant: "outline",
  size: "sm",
  className: "gap-1.5",
});

/* Written out rather than passed through `buttonVariants`: the outline
   variant's hover would light a locked control up as if it were usable. */
const LOCKED_TRIGGER =
  "h-7 gap-1.5 rounded-sm border border-border bg-surface px-2 text-xs whitespace-nowrap text-text";

const OWNER_LOCK = "The workspace owner's role can't be changed here.";

export function RoleSelect({
  memberName,
  role,
  roles,
  locked,
  onSelect,
}: {
  memberName: string;
  role: RoleDefinition;
  roles: RoleDefinition[];
  locked: boolean;
  onSelect: (role: RoleDefinition) => void;
}) {
  if (locked) {
    return (
      <LockedControl
        reason={OWNER_LOCK}
        label={`Role for ${memberName}: ${role.name}`}
        className={LOCKED_TRIGGER}
      >
        <RoleChip role={role} />
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
        <RoleChip role={role} />
        <ChevronDownIcon className="size-3.5 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {roles.map((option) => (
          <DropdownMenuItem
            key={option.id}
            /* Handing a workspace over is a transfer, not a role edit, and
               there is no screen for it yet. */
            disabled={option.id === "OWNER"}
            aria-current={option.id === role.id ? "true" : undefined}
            onSelect={() => onSelect(option)}
          >
            <RoleChip role={option} />
            {option.id === "OWNER" ? (
              <span className="ml-auto text-2xs text-text-subtle">
                Transfer unavailable
              </span>
            ) : (
              option.id === role.id && <CheckIcon className="ml-auto size-3.5" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
