import { cn } from "@/lib/cn";

/*
 * A control that is present, explains itself, and does nothing.
 *
 * `aria-disabled` rather than the `disabled` attribute, deliberately: a
 * disabled button is skipped by the keyboard and — through the button
 * variants' `disabled:pointer-events-none` — shows no `title` either, so the
 * one thing a locked control has to communicate is the one thing it cannot.
 * Here the reason travels three ways: tooltip, accessible name, and the dim.
 *
 * There is no `onClick` prop, and callers cannot add one. Inertness is the
 * contract, not a convention the next caller has to remember.
 *
 * The base sets no size, radius or colour — `cn` is a plain join, not a
 * conflict-aware merge, so what a base sets, it owns.
 */
const LOCKED =
  "inline-flex shrink-0 cursor-not-allowed items-center justify-center opacity-60";

export function LockedControl({
  reason,
  label,
  className,
  children,
}: {
  /** Why it is locked. The tooltip, and the tail of the accessible name. */
  reason: string;
  /** What the control would have done, naming the row it sits on. */
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title={reason}
      aria-label={`${label}. ${reason}`}
      className={cn(LOCKED, className)}
    >
      {children}
    </button>
  );
}
