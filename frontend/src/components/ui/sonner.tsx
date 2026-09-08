"use client";

import { usePathname } from "next/navigation";
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

/* `relative` and the asymmetric padding are both for the close button, which
   sits absolutely in the top-right corner: `pr-9` is what stops a long title
   from running underneath it. */
const TOAST_BASE =
  "relative flex w-full items-start gap-2.5 rounded-md border border-border bg-surface py-2.5 pl-3 pr-9 text-sm text-text shadow-overlay";

/*
 * The `(auth)` route group, matched by URL because a route group leaves no
 * trace in the path. These screens are a single centred card on an empty page,
 * so a bottom-centre toast lands under the form it is talking about — top right
 * keeps it clear of the card and of the submit button the user is aiming at.
 * Everywhere else keeps bottom-centre.
 */
const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/invite",
];

export function Toaster(props: ToasterProps) {
  const pathname = usePathname();
  const onAuthPage = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

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
      position={onAuthPage ? "top-right" : "bottom-center"}
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
          /* Styled from scratch, not tweaked: every one of sonner's own
             close-button rules is gated on `[data-styled='true']`, and
             `unstyled: true` sets that to false — so position, size, padding
             and the round border all arrive as nothing. Without the
             `absolute` here the button is a bare `<svg>` sitting in the toast's
             flex row, which is what it looked like. Its own hit area is 20px
             square with the icon at 12, so the target stays comfortable while
             the glyph stays quiet. */
          closeButton:
            "absolute right-2 top-2 grid size-5 place-items-center rounded-sm border border-transparent bg-transparent p-0 text-text-subtle transition-colors duration-100 ease-standard hover:border-border hover:bg-surface-hover hover:text-text [&>svg]:size-3",
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
