"use client";

import { ProjectGlyph } from "@/components/projects/project-glyph";

/**
 * The glyph + untitled-page-style title at the top of a project drawer, plus
 * the header's close button.
 *
 * The title is a bare input rather than a labelled `TextField`: it is the one
 * thing that must be filled in, and giving it the same 12px label as Key and
 * Status would bury it among them. `aria-label` carries the name a visible
 * label would have.
 *
 * Shared by create and edit so the two cannot drift — and so both drawer files
 * stay under the 150-line cap.
 */
export function DrawerCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="grid size-7 shrink-0 place-items-center rounded-sm text-text-subtle transition-colors duration-100 ease-standard hover:bg-surface-hover hover:text-text"
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="size-4" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    </button>
  );
}

export function DrawerTitleField({
  icon,
  color,
  defaultValue,
  placeholder,
  error,
  autoFocus = false,
  onChange,
}: {
  icon: string;
  color: string;
  defaultValue?: string;
  placeholder: string;
  error?: string;
  autoFocus?: boolean;
  onChange: (name: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <ProjectGlyph icon={icon} color={color} size="lg" label="Preview" />
      <div className="min-w-0 flex-1">
        <input
          name="name"
          autoComplete="off"
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Project name"
          className="w-full border-0 bg-transparent p-0 text-xl font-semibold tracking-tight text-text placeholder:text-text-subtle focus-visible:outline-none"
        />
        {error && <p className="mt-1 text-2xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
