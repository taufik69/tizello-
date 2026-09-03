"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";

const TRIGGER = buttonVariants({ variant: "ghost", size: "icon", className: "size-7" });

/**
 * The per-row kebab. Icon-only, so both branches name the task they act on —
 * "More actions" alone is useless in a list of twelve identical buttons.
 */
export function BacklogRowMenu({
  taskId,
  title,
  onEdit,
  onDelete,
}: {
  taskId: string;
  title: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${taskId}, ${title}`}
        className={TRIGGER}
      >
        <MoreIcon className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit task
        </DropdownMenuItem>

        {/* Destructive, so it reads as destructive before it is clicked. The
            colour sits on an inner span: `DropdownMenuItem` sets its own
            hover/focus text colour, and two competing `hover:text-*` classes
            would leave the stylesheet's order to decide the winner. */}
        <DropdownMenuItem onSelect={onDelete}>
          <span className="flex items-center gap-2 text-danger">
            <TrashIcon className="size-3.5" />
            Delete task
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
