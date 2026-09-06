"use client";

import { useEffect, useSyncExternalStore } from "react";
import { CheckIcon, DashIcon } from "@/components/ui/icons";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToToasts,
  type ToastRecord,
} from "@/lib/toast-store";

/*
 * The one toast outlet, mounted once in the root layout.
 *
 * Two accessibility details are load-bearing and both are easy to lose:
 *
 * 1. **The live regions are always in the tree**, empty or not. A `role="status"`
 *    that mounts at the same moment its text appears is frequently missed by
 *    screen readers — the region has to exist first for the insertion to be
 *    announced.
 * 2. **Errors are assertive, everything else is polite.** A failure interrupts;
 *    a confirmation waits its turn. Announcing every "Saved" assertively trains
 *    people to tune the region out, which costs them the one message that
 *    mattered.
 *
 * `pointer-events-none` on the wrapper so the strip never swallows a click
 * meant for the page; each chip takes them back for its dismiss button.
 */

const WRAP =
  "pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4";

const CHIP =
  "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-md border bg-surface px-3 py-2.5 text-sm text-text shadow-overlay";

/* Neutral ink on every variant, with the hue carried by the icon and the
   border rather than by the text. DESIGN-SYSTEM.md measures `text-danger` on a
   tinted fill at 4.57:1 and `text-success` at 2.82:1 — below AA — while
   `text-text` clears both. Coloured text on a tinted chip is the pairing this
   system explicitly does not ship. */
const TONE: Record<ToastRecord["variant"], string> = {
  success: "border-border",
  error: "border-danger",
  info: "border-border",
};

const ICON_TONE: Record<ToastRecord["variant"], string> = {
  success: "text-success",
  error: "text-danger",
  info: "text-text-subtle",
};

const DISMISS =
  "-mr-1 ml-auto shrink-0 rounded-xs p-0.5 text-text-subtle transition-colors duration-100 ease-standard hover:text-text";

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToToasts, getToasts, getServerToasts);

  const polite = toasts.filter((entry) => entry.variant !== "error");
  const assertive = toasts.filter((entry) => entry.variant === "error");

  return (
    <div className={WRAP}>
      <div role="status" aria-live="polite" className="contents">
        {polite.map((entry) => (
          <ToastChip key={entry.id} toast={entry} />
        ))}
      </div>

      <div role="alert" aria-live="assertive" className="contents">
        {assertive.map((entry) => (
          <ToastChip key={entry.id} toast={entry} />
        ))}
      </div>
    </div>
  );
}

function ToastChip({ toast }: { toast: ToastRecord }) {
  const { id, duration, variant, message } = toast;

  /* Keyed by id, so the timer is created once per toast and torn down with it.
     A re-render of the list cannot re-arm a countdown that is already running,
     because neither dependency changes for the life of the chip. */
  useEffect(() => {
    const timer = setTimeout(() => dismissToast(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration]);

  const Mark = variant === "error" ? DashIcon : CheckIcon;

  return (
    <p className={`${CHIP} ${TONE[variant]}`}>
      <Mark className={`mt-0.5 size-3.5 shrink-0 ${ICON_TONE[variant]}`} />

      <span className="min-w-0 flex-1">{message}</span>

      <button
        type="button"
        onClick={() => dismissToast(id)}
        aria-label="Dismiss notification"
        className={DISMISS}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
          <path
            d="M4 4l8 8M12 4l-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </p>
  );
}
