"use client";

/*
 * The label and the row of the add-property menu.
 *
 * Their own file so `add-property-menu.tsx` stays under the 150-line cap, and
 * because both are pure presentation — a section heading and an
 * icon/label/hint button — with nothing about properties in them.
 */

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pt-2 pb-1 text-2xs font-medium tracking-wide text-text-subtle uppercase">
      {children}
    </p>
  );
}

export function MenuItem({
  icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left transition-colors duration-100 ease-standard hover:bg-surface-hover disabled:opacity-50"
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-text">{label}</span>
        <span className="block text-2xs text-text-subtle">{hint}</span>
      </span>
    </button>
  );
}
