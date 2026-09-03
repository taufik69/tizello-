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
        {/* Destructive, so it reads as destructive before it is clicked, and it
            opens a confirmation rather than acting on the spot. The colour sits
            on an inner span because `DropdownMenuItem` sets its own hover text
            colour and two competing `hover:text-*` classes would leave the
            winner to the stylesheet's order. */}
        <DropdownMenuItem onSelect={onCancel}>
          <span className="flex items-center gap-2 text-danger">
            <TrashIcon className="size-3.5" />
            Cancel invite
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
