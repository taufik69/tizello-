"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FlagIcon,
  MoreIcon,
  PencilIcon,
  PlayIcon,
  TrashIcon,
} from "@/components/ui/icons";
import type { SprintRecord } from "@/types/sprint";

const TRIGGER = buttonVariants({
  variant: "ghost",
  size: "icon",
  className: "size-7",
});

/**
 * The per-card kebab. Icon-only, so the trigger names the sprint it acts on —
 * "More actions" alone is useless in a list of five identical buttons.
 *
 * Start and Complete are shown ONLY on the state that can reach them: a
 * completed sprint has no transition left, and an item that is always there but
 * usually inert is an item people learn to ignore. The one exception is Start
 * while another sprint is running — that item stays, disabled, with the reason
 * beside it, because "why can't I start this?" is the question a missing item
 * would leave unanswered.
 *
 * The reason does NOT name the running sprint. A name can be sixty characters
 * long (SPR-15 in the fixture is), and a menu that grows to fit one would run
 * off the right edge at 360px. Which sprint is running is stated in the toolbar
 * above, where the text is free to wrap.
 */
export function SprintCardMenu({
  sprint,
  startBlocked,
  onEdit,
  onStart,
  onComplete,
  onDelete,
}: {
  sprint: SprintRecord;
  /** Another sprint is already running, so this one cannot start. */
  startBlocked: boolean;
  onEdit: () => void;
  onStart: () => void;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${sprint.name}`}
        className={TRIGGER}
      >
        <MoreIcon className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon className="size-3.5" />
          Edit sprint
        </DropdownMenuItem>

        {sprint.state === "PLANNING" && (
          <DropdownMenuItem disabled={startBlocked} onSelect={onStart}>
            <PlayIcon className="size-3.5" />
            Start sprint
            {startBlocked && (
              <span className="ml-auto pl-2 text-2xs whitespace-nowrap text-text-subtle">
                Another is running
              </span>
            )}
          </DropdownMenuItem>
        )}

        {sprint.state === "ACTIVE" && (
          <DropdownMenuItem onSelect={onComplete}>
            <FlagIcon className="size-3.5" />
            Complete sprint
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Destructive, so it reads as destructive before it is clicked. The
            colour sits on an inner span: `DropdownMenuItem` sets its own
            hover/focus text colour, and two competing `hover:text-*` classes
            would leave the stylesheet's order to decide the winner. */}
        <DropdownMenuItem onSelect={onDelete}>
          <span className="flex items-center gap-2 text-danger">
            <TrashIcon className="size-3.5" />
            Delete sprint
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
