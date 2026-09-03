import { BRAND_FILL } from "@/components/ui/button";

/**
 * The primary button on every auth form. 40px, full width.
 *
 * The colour, hover and press treatment now lives in `ui/button.tsx` as
 * `BRAND_FILL`, so the auth submit and the app's `<Button variant="default">`
 * cannot drift apart. Only the geometry is local:
 *
 * `bg-brand-500` carries `text-on-brand` — dark ink, 7.1:1. White on mint is
 * 2.2:1 and must never ship (DESIGN-SYSTEM.md, contrast rule).
 *
 * Hover DEEPENS to `brand-600` (5.2:1, still AA) rather than lightening to
 * `brand-400`. Lightening a mint fill reads as the button going flat the moment
 * you point at it, which is the opposite of what a hover should say. The press
 * is a 1px drop, not a third colour.
 */
export const AUTH_BUTTON = `h-10 w-full rounded-sm text-sm font-semibold ${BRAND_FILL}`;

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
