/**
 * Session cookie names, kept framework-free so `src/proxy.ts` can import them
 * without dragging `next/headers` into the proxy bundle.
 *
 * **These names are the API's, not ours.** The backend issues both, both are
 * `httpOnly`, and this app only ever forwards them (see `lib/api-client.ts`) —
 * it never mints, signs or reads a session value of its own. Renaming either
 * string here without changing `backend/src/shared/utils/cookies.js` silently
 * signs everybody out.
 */
export const ACCESS_COOKIE = "tizello_access";

/**
 * Scoped by the API to `path=/api/v1/auth/refresh`, so the browser sends it to
 * that one endpoint and nowhere else. Anything that re-scopes it to `/` throws
 * away the narrowest part of the session design.
 */
export const REFRESH_COOKIE = "tizello_refresh";

/**
 * The presence of the access cookie is the only thing middleware can cheaply
 * check. It proves nothing — the signature and expiry are verified by the API —
 * so it may gate a redirect, never a data read.
 */
export const SESSION_COOKIE = ACCESS_COOKIE;

/** Session lifetime is the API's REFRESH_TOKEN_TTL_DAYS; kept for callers. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Where a signed-in user lands — the running sprint's board, which is spec §3's
 * `/board/sprint` now that the id resolves to the one ACTIVE sprint rather than
 * to a fixture board's key.
 */
export const BOARD_HOME = "/board/sprint";
