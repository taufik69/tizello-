import { AuthShapes } from "@/components/auth/auth-shapes";

/*
 * The right half of the split shell. Three stacked layers (spec §5):
 *   1. the gradient field  — `auth-field` + `auth-noise` in globals.css
 *   2. the shapes          — AuthShapes, one inline SVG
 *   3. the copy            — real text, per route
 *
 * Zero JavaScript: a Server Component, CSS and inline SVG only. Reading the
 * route here with usePathname would drag the layout across the client
 * boundary, so each page passes its own `variant` instead.
 *
 * Removed entirely below `lg` rather than stacked — nobody should scroll past
 * decoration to reach a login form.
 */
const COPY = {
  "sign-in": {
    title: "Welcome back.",
    body: "Your boards, lists and cards are exactly where you left them.",
  },
  "sign-up": {
    title: "Organise anything.",
    body: "Boards, lists and cards for the work your team actually does.",
  },
  "forgot-password": {
    title: "Everyone forgets.",
    body: "One link, and you are back on the board in under a minute.",
  },
  "reset-password": {
    title: "A clean slate.",
    body: "Set a new password and we will take you straight back to sign in.",
  },
  "verify-email": {
    title: "Almost there.",
    body: "One click in your inbox and your workspace is ready to use.",
  },
} as const;

export type AuthAsideVariant = keyof typeof COPY;

export function AuthAside({ variant }: { variant: AuthAsideVariant }) {
  const { title, body } = COPY[variant];

  return (
    <aside className="auth-field relative hidden overflow-hidden lg:block">
      <div className="auth-noise pointer-events-none absolute inset-0" aria-hidden="true" />
      <AuthShapes />

      <div className="relative flex h-full flex-col justify-end p-10 xl:p-14">
        <p className="max-w-xs text-xl font-semibold tracking-tight text-on-board">
          {title}
        </p>
        <p className="mt-2 max-w-sm text-sm text-on-board">{body}</p>
      </div>
    </aside>
  );
}
