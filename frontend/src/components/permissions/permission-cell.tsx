"use client";

import { CheckIcon, DashIcon } from "@/components/ui/icons";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import type { RoleDefinition } from "@/types/permissions";

/*
 * Neutral ink on a tinted fill, per the contrast table in DESIGN-SYSTEM.md:
 * `text-success` on `bg-success-subtle` is 2.82:1 in light and fails AA, so the
 * hue is carried by the fill and the glyph takes `text-text-muted`.
 *
 * Denial is a dash on the sunken fill rather than a red cross — most cells are
 * denials, and fourteen red marks would read as fourteen faults.
 *
 * A built-in role's cell is static text; a workspace-defined role's is a real
 * `<button>` with `aria-pressed`, so a permission is granted where it is read.
 */
const MARK = "inline-flex size-6 items-center justify-center rounded-xs";
const ALLOWED = "bg-success-subtle text-text-muted";
const DENIED = "bg-surface-sunken text-text-subtle";
const EDITABLE =
  "cursor-pointer transition-colors duration-100 ease-standard hover:bg-brand-100 hover:text-brand-800";

export function PermissionCell({
  role,
  actionLabel,
  allowed,
  onToggle,
}: {
  role: RoleDefinition;
  actionLabel: string;
  allowed: boolean;
  onToggle: () => void;
}) {
  const glyph = allowed ? (
    <CheckIcon className="size-3.5" />
  ) : (
    <DashIcon className="size-3.5" />
  );
  const answer = allowed ? "allowed" : "not allowed";

  return (
    <TableCell className="px-4 py-1.5 text-center">
      {role.builtIn ? (
        <span className={cn(MARK, allowed ? ALLOWED : DENIED)}>
          {glyph}
          {/* The glyph is never the only carrier of meaning: a row read aloud
              names the role and the answer rather than three shapes. */}
          <span className="sr-only">
            {role.name}: {answer}
          </span>
        </span>
      ) : (
        <button
          type="button"
          aria-pressed={allowed}
          aria-label={`${actionLabel} — ${role.name}: ${answer}`}
          onClick={onToggle}
          className={cn(MARK, EDITABLE, allowed ? ALLOWED : DENIED)}
        >
          {glyph}
        </button>
      )}
    </TableCell>
  );
}
