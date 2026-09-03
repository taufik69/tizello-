"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import {
  getMobileSidebarServerSnapshot,
  readMobileSidebarOpen,
  setMobileSidebarOpen,
  subscribeToMobileSidebar,
} from "@/lib/sidebar";

/*
 * The off-canvas sidebar, below `md`.
 *
 * A native <dialog> opened with showModal(), the same technique as
 * `ui/dialog.tsx` — that one call gives focus trapping, Esc-to-close, the top
 * layer and an inert page behind, with no portal and no dependency. It is not
 * `Dialog` itself because that primitive is a centred panel: the drawer needs
 * `m-0` and full height, which would mean fighting the base classes.
 *
 * Tailwind's preflight zeroes the UA's `margin: auto`, so the panel pins to the
 * inline start on its own; `m-0` states that rather than relying on it.
 */
const PANEL =
  "m-0 h-dvh max-h-dvh w-sidebar border-r border-border bg-canvas p-0 text-text backdrop:bg-scrim md:hidden";

const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const open = useSyncExternalStore(
    subscribeToMobileSidebar,
    readMobileSidebarOpen,
    getMobileSidebarServerSnapshot,
  );
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) {
      element.showModal();
      /* React strips `autoFocus` and focuses during commit, which is before
         showModal() has run — so focus is placed by hand, as in ui/dialog. */
      element.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }
    if (!open && element.open) element.close();
  }, [open]);

  /* Navigating closes the drawer. The store guards a no-op, so this is inert
     on mount and on every render where the path has not changed. */
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <dialog
      ref={ref}
      aria-label="Navigation"
      /* Fires for Esc and for element.close() alike — one place to resync. */
      onClose={() => setMobileSidebarOpen(false)}
      /* The backdrop belongs to the dialog's own box, so a click landing on the
         element rather than its contents is a click outside. */
      onClick={(event) => {
        if (event.target === ref.current) setMobileSidebarOpen(false);
      }}
      className={PANEL}
    >
      {/* Rendered only while open: the same sidebar tree is also mounted in the
          desktop <aside>, and one copy in the accessibility tree is enough. */}
      {open && children}
    </dialog>
  );
}
