"use client";

import { PropertyIcon, type PropertyIconKind } from "@/components/projects/property-icons";

/**
 * One `label — value` line of the property list.
 *
 * A two-column grid, not a `<label>` wrapping both halves: a row's value can be
 * two date fields or a colour picker, and a `<label>` may only be associated
 * with one control. The label is therefore a plain `<span>` and each control
 * inside carries its own labelling — which is why the value slot takes a node
 * rather than a value plus a type.
 *
 * `onRemove` is absent on the four required rows. A project cannot exist
 * without a name, key, status and priority, so those have nothing to remove;
 * offering a ✕ that refuses would be worse than not offering one.
 */
export function PropertyRow({
  label,
  icon,
  onRemove,
  children,
}: {
  label: string;
  icon: PropertyIconKind;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group grid grid-cols-[7.5rem_1fr] items-start gap-2 py-1">
      <span className="flex items-center gap-1.5 pt-2 text-xs text-text-subtle">
        <PropertyIcon kind={icon} />
        <span className="min-w-0 truncate">{label}</span>
      </span>

      <div className="flex min-w-0 items-start gap-1">
        <div className="min-w-0 flex-1">{children}</div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            /* Revealed on hover and on keyboard focus alike. `group-hover`
               alone would leave the control unreachable by keyboard, since
               focus does not imply hover. */
            className="mt-1 grid size-7 shrink-0 place-items-center rounded-sm text-text-subtle opacity-0 transition-opacity duration-100 ease-standard group-hover:opacity-100 hover:bg-surface-hover hover:text-text focus-visible:opacity-100"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
