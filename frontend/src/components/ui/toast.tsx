"use client";

import { useEffect } from "react";
import { CheckIcon } from "@/components/ui/icons";

/*
 * A single transient confirmation. Deliberately not a queue: one message at a
 * time is all any screen here produces, and a stack manager would be a
 * dependency's worth of code for a chip that says "Done".
 *
 * The live region is ALWAYS in the tree, empty or not. A `role="status"` that
 * is mounted at the same moment its text appears is frequently missed by
 * screen readers — the region has to exist first for the insertion to be
 * announced.
 *
 * `pointer-events-none` on the wrapper so the strip never swallows a click
 * meant for the page; the chip itself takes them back.
 */
const WRAP =
  "pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4";
const CHIP =
  "pointer-events-auto flex max-w-full items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text shadow-overlay";

export function Toast({
  message,
  onDismiss,
  duration = 4000,
}: {
  /** `null` keeps the region mounted and empty. */
  message: string | null;
  /**
   * Called when the message has had its time. Must be STABLE — an inline arrow
   * re-arms the timer on every parent render.
   */
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <div role="status" aria-live="polite" className={WRAP}>
      {message && (
        <p className={CHIP}>
          <CheckIcon className="size-3.5 shrink-0 text-text-muted" />
          <span className="min-w-0 truncate">{message}</span>
        </p>
      )}
    </div>
  );
}
