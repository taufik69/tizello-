"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreIcon, TrashIcon } from "@/components/ui/icons";

const TRIGGER = buttonVariants({ variant: "ghost", size: "icon" });

/**
 * The per-invitation kebab, the same row grammar as `MemberActionsMenu`.
 * Icon-only, so the accessible name carries the address it acts on — three
 * identical buttons all called "More actions" name nothing.
 *
 * There is no locked branch here: an invitation has no owner to protect.
 */
export function PendingInviteMenu({
  email,
  onCancel,
}: {
  email: string;
  onCancel: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for the invitation to ${email}`}
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
          onSelect={onCancel}
        >
          Cancel invite
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
