"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreIcon, TrashIcon } from "@/components/ui/icons";
import { LockedControl } from "@/components/ui/locked-control";

const TRIGGER = buttonVariants({ variant: "ghost", size: "icon" });

/* Written out, not `buttonVariants({ variant: "ghost" })`: a locked control
   must not take the hover fill of a live one. */
const LOCKED_TRIGGER = "size-9 rounded-sm text-text-muted";

const OWNER_LOCK = "The workspace owner can't be removed.";

/**
 * The per-row kebab. Icon-only, so every branch names the member it acts on —
 * "More actions" alone is useless in a list of five identical buttons.
 */
export function MemberActionsMenu({
  memberName,
  locked,
  onRemove,
}: {
  memberName: string;
  /** True on the owner's row: there is nothing here they may do. */
  locked: boolean;
  onRemove: () => void;
}) {
  if (locked) {
    return (
      <LockedControl
        reason={OWNER_LOCK}
        label={`Actions for ${memberName}`}
        className={LOCKED_TRIGGER}
      >
        <MoreIcon className="size-4" />
      </LockedControl>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${memberName}`}
        className={TRIGGER}
      >
        <MoreIcon className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {/* Destructive, so it reads as destructive before it is clicked — and
            it opens a confirmation rather than acting on the spot. The colour
            sits on an inner span: `DropdownMenuItem` sets its own hover/focus
            text colour, and two competing `hover:text-*` classes would leave
            the stylesheet's order to decide the winner. */}
        <DropdownMenuItem onSelect={onRemove}>
          <span className="flex items-center gap-2 text-danger">
            <TrashIcon className="size-3.5" />
            Remove from workspace
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
