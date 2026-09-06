"use client";

import { useSyncExternalStore } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckIcon, DashIcon } from "@/components/ui/icons";
import {
  getThemeServerSnapshot,
  readStoredTheme,
  subscribeToTheme,
} from "@/lib/theme";

/*
 * The shadcn/ui toast primitive — `sonner`, not the older Radix-based Toast
 * component shadcn deprecated in its favour. This file is what `npx shadcn add
 * sonner` generates, with the two parts every project has to fill in itself:
 *
 * 1. **Theme.** shadcn's canonical version reads `next-themes`' `useTheme()`.
 *    This app has no `next-themes` — it has its own `data-theme` attribute and
 *    `useSyncExternalStore` hook (`lib/theme.ts`), the same one `ThemeToggle`
 *    reads. Sonner's own `theme` prop accepts exactly this app's `Theme` type
 *    (`"light" | "dark" | "system"`), so the two slot together directly.
 * 2. **Colour.** shadcn's default styles reference `--popover` /
 *    `--popover-foreground`, tokens from its own starter palette that this
 *    project never adopted (see DESIGN-SYSTEM.md). `unstyled: true` strips
 *    sonner's built-in look entirely and `classNames` rebuilds it from this
 *    app's real semantic tokens instead — `bg-surface`, `border-danger`, etc.
 *    — so a themed toast flips with the rest of the app for free.
 *
 * **Neutral ink on every variant, colour carried by the border and icon only.**
 * DESIGN-SYSTEM.md measured `text-danger` on a tinted fill at 4.57:1 and
 * `text-success` at 2.82:1 in light mode — both fail AA. `text-text` on
 * `bg-surface` clears both, which is why no variant below sets a coloured
 * text class.
 */

const TOAST_BASE =
  "flex items-start gap-2.5 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text shadow-overlay w-full";

export function Toaster(props: ToasterProps) {
  /* Same store `ThemeToggle` reads: the server renders "system" (no
     preference is knowable yet), the client swaps in the real value during
     hydration, and sonner's own theme prop takes it from there — an explicit
     "light" or "dark" forces sonner's palette, "system" hands it to sonner's
     own prefers-color-scheme listener, matching how the rest of the app
     resolves color-scheme. */
  const theme = useSyncExternalStore(subscribeToTheme, readStoredTheme, getThemeServerSnapshot);

  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      closeButton
      icons={{
        success: <CheckIcon className="size-3.5 shrink-0 text-success" />,
        error: <DashIcon className="size-3.5 shrink-0 text-danger" />,
        info: <CheckIcon className="size-3.5 shrink-0 text-text-subtle" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: TOAST_BASE,
          title: "min-w-0 flex-1",
          description: "min-w-0 flex-1 text-text-muted",
          error: "border-danger",
          closeButton:
            "left-auto right-1.5 top-1.5 border-none bg-transparent text-text-subtle hover:text-text",
          actionButton:
            "rounded-xs bg-brand-500 px-2 py-1 text-2xs font-semibold text-on-brand hover:bg-brand-600",
          cancelButton:
            "rounded-xs bg-surface-sunken px-2 py-1 text-2xs font-medium text-text-muted hover:bg-surface-hover",
        },
      }}
      {...props}
    />
  );
}
