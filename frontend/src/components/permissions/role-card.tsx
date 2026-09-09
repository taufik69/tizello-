"use client";

import { Card } from "@/components/ui/card";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/plural";
import type { RoleDefinition } from "@/types/permissions";

/*
 * One role, compact: the name, then a single line of counts. No summary
 * paragraph — three of those side by side is a wall of prose above a table
 * that says the same thing precisely.
 *
 * The Owner card carries the heavier border. That is the whole hierarchy
 * treatment: the cards are already in rank order, and the matrix beside them
 * is the real answer to "what does this role get".
 */
const ICON_BUTTON =
  "inline-flex size-6 shrink-0 items-center justify-center rounded-xs text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text";

export function RoleCard({
  role,
  memberCount,
  actionCount,
  onEdit,
  onDelete,
}: {
  role: RoleDefinition;
  memberCount: number;
  actionCount: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className={cn(
        "h-full gap-1 p-3",
        role.id === "OWNER" ? "border-border-strong" : "border-border",
      )}
    >
      <div className="flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
          {role.name}
        </h3>

        {!role.builtIn && (
          <>
            <button
              type="button"
              aria-label={`Edit ${role.name}`}
              onClick={onEdit}
              className={ICON_BUTTON}
            >
              <PencilIcon className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label={`Delete ${role.name}`}
              onClick={onDelete}
              className={ICON_BUTTON}
            >
              <TrashIcon className="size-3.5" />
            </button>
          </>
        )}
      </div>

      {/* `tabular-nums` so the counters do not twitch as roles are reassigned. */}
      <p className="flex items-center gap-1.5 text-2xs text-text-subtle">
        <span className="tabular-nums">
          {plural(memberCount, "member", "members")}
        </span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">
          {role.allowed.length}/{actionCount} actions
        </span>
      </p>
    </Card>
  );
}
