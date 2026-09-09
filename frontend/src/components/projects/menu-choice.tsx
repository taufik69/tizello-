"use client";

import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/*
 * The rows the toolbar menus are made of: a section label, a one-of-many
 * choice, and an on/off row.
 *
 * Their own file so `projects-filter-menu.tsx`, `projects-sort-menu.tsx` and
 * `projects-display-menu.tsx` each stay well under the 150-line cap, and
 * because all three are pure presentation with nothing about projects in them.
 *
 * A CHECK MARK IN A FIXED GUTTER, not a check that appears and shifts the
 * label. Every row reserves the same 14px whether or not it is chosen, so a
 * list does not re-flow as the selection moves down it — and the labels stay
 * on one left edge, which is what makes the set scannable.
 *
 * `role="menuitemradio"` / `menuitemcheckbox` rather than plain buttons: these
 * sit inside a `role="menu"` panel, and the distinction is the difference
 * between "eight buttons" and "one choice with eight options, this one
 * current" when it is read aloud.
 */
const ROW =
  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors duration-100 ease-standard hover:bg-surface-hover";

export function MenuHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pt-2 pb-1 text-2xs font-medium tracking-wide text-text-subtle uppercase">
      {children}
    </p>
  );
}

export function MenuChoice({
  label,
  selected,
  adornment,
  checkbox,
  onSelect,
}: {
  label: string;
  selected: boolean;
  /** The dot or chip that carries the meaning at a glance. Decorative — the label sits beside it. */
  adornment?: React.ReactNode;
  /** An independent on/off row rather than one of a set. */
  checkbox?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role={checkbox ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(ROW, selected ? "text-text" : "text-text-muted")}
    >
      <span className="grid size-3.5 shrink-0 place-items-center text-text-brand">
        {selected && <CheckIcon className="size-3" />}
      </span>
      {adornment && (
        <span aria-hidden="true" className="shrink-0">
          {adornment}
        </span>
      )}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/** The full-width "Clear" / "Reset" line that closes a menu. */
export function MenuAction({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <>
      <span className="my-1 block h-px bg-border" aria-hidden="true" />
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={onClick}
        className={cn(ROW, "font-medium text-text-muted disabled:opacity-50 disabled:hover:bg-transparent")}
      >
        <span className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </button>
    </>
  );
}
