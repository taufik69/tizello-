"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/initials";

/*
 * A person as the Collaborators row draws them — a chip in the row, a row in
 * the picker.
 *
 * Their own file so `collaborators-row.tsx` stays under the 150-line cap, and
 * because both are pure presentation: initials, a name, and at most one
 * action. Initials only, like every other avatar here — nothing in this app
 * has an image source.
 */

export function PersonChip({
  name,
  disabled,
  onRemove,
}: {
  name: string;
  disabled?: boolean;
  /** Omitted for someone who cannot be removed — the owner, or a viewer with no write access. */
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-1.5 rounded-xs bg-surface-sunken px-1 py-0.5">
      <Avatar className="size-4 border border-border text-text-muted">
        <AvatarFallback className="text-[0.5rem]">
          <span aria-hidden="true">{initials(name)}</span>
        </AvatarFallback>
      </Avatar>
      <span className="max-w-32 truncate text-2xs text-text">{name}</span>

      {onRemove && (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="text-text-subtle transition-colors duration-100 ease-standard hover:text-danger"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-2.5" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </li>
  );
}

export function PersonOption({
  name,
  disabled,
  onSelect,
}: {
  name: string;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-100 ease-standard hover:bg-surface-hover disabled:opacity-50"
    >
      <Avatar className="size-5 border border-border text-text-muted">
        <AvatarFallback className="text-2xs">
          <span aria-hidden="true">{initials(name)}</span>
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0 flex-1 truncate text-xs text-text">{name}</span>
    </button>
  );
}
