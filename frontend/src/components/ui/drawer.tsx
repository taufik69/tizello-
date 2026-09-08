"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/*
 * A right-hand peek panel — Notion's, not a centred modal.
 *
 * Built on the native `<dialog>` with `showModal()`, exactly as `ui/dialog.tsx`
 * is, and for the same payoff: focus trapping, Esc-to-close, inertness of the
 * page behind, and the top layer, with no portal, no scroll lock and no
 * dependency. The difference is purely where it sits — `ml-auto` with a full
 * height instead of `m-auto` with a max width.
 *
 * A SEPARATE FILE rather than a `side` prop on `Dialog`: the two differ in
 * their entrance animation, their close affordance (a drawer carries its own
 * ✕, a dialog is dismissed by its footer) and their scroll behaviour, and
 * threading three conditionals through `Dialog` to save one file would make
 * the common case harder to read.
 *
 * Tailwind's preflight zeroes margins, which removes the UA's `margin: auto` —
 * hence the explicit `ml-auto` below rather than relying on the default.
 */
const PANEL =
  "drawer-enter ml-auto h-dvh max-h-dvh w-full max-w-lg overflow-y-auto border-0 border-l border-border bg-surface p-0 text-text shadow-modal backdrop:bg-scrim";

/* React strips `autoFocus` on the client and calls .focus() during commit —
   too early, because the dialog is still closed and hidden at that point.
   Focus is therefore placed by hand once showModal() has run. */
const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Drawer({
  open,
  onOpenChange,
  className,
  children,
  ...props
}: Omit<React.ComponentProps<"dialog">, "open" | "onClose"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) {
      element.showModal();
      element.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }
    /* Closing hands focus back to whatever opened the drawer — the browser
       restores it for us, so there is nothing to do here. */
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      /* Fires for Esc and for element.close() alike, so it is the single place
         the parent's state is brought back in sync. */
      onClose={() => onOpenChange(false)}
      /* The backdrop is part of the dialog's own box, so a click that lands on
         the element itself — rather than on the content inside it — is a click
         outside. */
      onClick={(event) => {
        if (event.target === ref.current) onOpenChange(false);
      }}
      className={cn(PANEL, className)}
      {...props}
    >
      {children}
    </dialog>
  );
}

/** Sticky, so the title and the close button survive a long scroll. */
export function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

/** Sticky to the bottom edge — the save button must not scroll away from a long property list. */
export function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}
