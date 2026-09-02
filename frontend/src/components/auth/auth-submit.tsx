/**
 * The primary button on every auth form. 40px, full width.
 *
 * `bg-brand-500` carries `text-on-brand` — dark ink, 7.1:1. White on mint is
 * 2.2:1 and must never ship (DESIGN-SYSTEM.md, contrast rule).
 */
export const AUTH_BUTTON =
  "h-10 w-full rounded-sm bg-brand-500 text-sm font-semibold text-on-brand transition-colors duration-100 ease-standard hover:bg-brand-400 disabled:opacity-60";

export function AuthSubmit({
  label,
  pending,
  pendingLabel = "Working…",
}: {
  label: string;
  pending: boolean;
  pendingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={AUTH_BUTTON}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
