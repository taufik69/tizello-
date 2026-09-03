/*
 * TEMPORARY — design review only.
 *
 * `/board/*` is gated twice: `proxy.ts` checks the session cookie exists, and
 * the page resolves that cookie to a user. Both are correct and neither is
 * being deleted; this flag short-circuits them so the board screens can be
 * looked at without signing in.
 *
 * Flip to `false` to restore the real gate. Do not ship this as `true`.
 */
export const SKIP_AUTH = true;
