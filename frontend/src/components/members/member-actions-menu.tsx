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

/**
 * The per-row kebab. Icon-only, so every branch names the member it acts on —
 * "More actions" alone is useless in a list of five identical buttons.
 *
 * `lock` is the REASON rather than a boolean, for the same reason as
 * `MemberRoleMenu`: the owner cannot be removed, you cannot remove yourself
 * (leaving is its own endpoint, and does not exist yet — see
 * `backend/docs/api/member.md` open question 2), and a plain MEMBER cannot
 * remove anyone. Three different facts, three different sentences.
 */
export function MemberActionsMenu({
  memberName,
  lock,
  onRemove,
}: {
  memberName: string;
  /** Why there is nothing here to open, or `null` when there is. */
  lock: string | null;
  onRemove: () => void;
}) {
  if (lock) {
    return (
      <LockedControl
        reason={lock}
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
        {/* Destructive, so it reads as destructive before it is clicked —
            hover included — and it opens a confirmation rather than acting on
            the spot. See `TONE` in `ui/dropdown-menu-item.tsx` for why this is
            a variant rather than a red span. */}
        <DropdownMenuItem
          variant="danger"
          icon={<TrashIcon className="size-3.5" />}
          onSelect={onRemove}
        >
          Remove from workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
