import { AuthAside } from "@/components/auth/auth-aside";
import { AuthLegalFooter } from "@/components/auth/auth-legal-footer";
import { AuthLogo } from "@/components/auth/auth-logo";

const FIELD_ROWS = ["workspace", "inviter", "role"];

/**
 * The route awaits a token lookup, so it gets a fallback rather than blocking
 * navigation on it.
 *
 * The column geometry is repeated here rather than borrowed from `AuthColumn`,
 * because `AuthColumn` renders the screen's `<h1>` — and a fallback that
 * carries a heading puts a second one into the streamed HTML before it is
 * swapped out. `MembersLoading` makes the same trade: skeleton bars where the
 * text will be, and one `role="status"` for anyone who cannot see them.
 *
 * The three children — logo, `flex-1` main, footer — have to match
 * `AuthColumn`'s exactly. Drop the footer and the `flex-1` middle absorbs its
 * height, which moves the centred block down and then jerks it back up when
 * the real page arrives. `AuthLegalFooter` is shared with `AuthColumn` so the
 * two cannot drift apart again.
 */
export default function InviteLoading() {
  return (
    <>
      <div className="flex min-h-dvh flex-col bg-surface px-6 py-8 sm:px-10">
        <AuthLogo />

        <main className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-[22rem]">
            <div className="mb-6 space-y-2">
              <div className="h-6 w-52 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
              <div className="h-4 w-64 max-w-full animate-pulse rounded-sm bg-surface-sunken" />
            </div>

            <div className="space-y-3 rounded-md border border-border bg-surface-sunken p-4">
              {FIELD_ROWS.map((row) => (
                <div
                  key={row}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="h-3 w-20 animate-pulse rounded-xs bg-surface" />
                  <div className="h-3 w-28 animate-pulse rounded-xs bg-surface" />
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="h-10 w-full animate-pulse rounded-sm bg-surface-sunken" />
              <div className="h-10 w-full animate-pulse rounded-sm bg-surface-sunken" />
            </div>

            <span className="sr-only" role="status">
              Loading invitation
            </span>
          </div>
        </main>

        <AuthLegalFooter />
      </div>

      <AuthAside variant="invite" />
    </>
  );
}
