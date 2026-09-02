/**
 * Session cookie constants, kept framework-free so `src/proxy.ts` can import
 * them without dragging the fixture store (or `next/headers`) into the proxy
 * bundle.
 *
 * The cookie holds a user id and nothing else. The real implementation will
 * hold an opaque, server-side-validated session token — see spec §9.
 */
export const SESSION_COOKIE = "tizello_session";

/** "Remember me" on: 30 days. Off: a session cookie, so `maxAge` is omitted. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Where a signed-in user lands. Spec §3 writes this as `/board/sprint`; the
 * fixture board in `src/lib/boards.ts` is `sprint-4`, and `/board/sprint`
 * renders not-found, so the real id is used here.
 */
export const BOARD_HOME = "/board/sprint-4";
