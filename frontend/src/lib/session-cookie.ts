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
 * Scoped by the API to `path=/api/v1/auth/refresh` on the API's own origin, so
 * a browser talking straight to the API sends it to that one endpoint.
 *
 * On *this* origin it is always `path=/`, and has to be: the browser talks to
 * Next and Next talks to the API, so a cookie the browser will not attach to a
 * page request is a cookie the server can never forward. `forwardSetCookies`
 * in api-client.ts rewrites the path on every sign-in Next proxies, and the
 * OAuth callback — the one route the browser reaches directly — writes `/`
 * itself. Re-narrowing it here does not harden anything; it silently ends every
 * session when the access token lapses fifteen minutes later.
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
 * Where a signed-in user lands: the workspace list, which is what the sidebar
 * also calls Home (`lib/nav-links.ts`). It used to be `/board/sprint` — one
 * hard-coded sprint board, which only makes sense for an account that already
 * has that workspace, and left a new user staring at someone else's sprint
 * instead of their own workspaces.
 */
export const HOME = "/workspaces";

/** The query param `WelcomeFireworks` (`workspaces/page.tsx`) looks for. */
export const WELCOME_PARAM = "welcome";

/**
 * `HOME`, flagged for the one-time fireworks. Used by every action that just
 * finished proving a credential — password/code sign-in, registration code —
 * so the celebration fires on a real login, not on every ordinary visit.
 * Only ever applied when the destination *is* home: a sign-in that deep-linked
 * back to some other page (`next`) skips it, since "just landed on home" is
 * specifically what earns the moment.
 */
export const homeWithWelcome = () => `${HOME}?${WELCOME_PARAM}=1`;
