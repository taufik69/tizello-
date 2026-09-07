import { cookies } from "next/headers";
import { REFRESH_COOKIE } from "@/lib/session-cookie";

/*
 * The one place the frontend talks to the backend.
 *
 * Everything here runs on the SERVER — inside Server Components and Server
 * Actions — never in the browser. That is what lets the session stay in
 * `httpOnly` cookies the page's JavaScript can never read: the browser talks to
 * Next, Next talks to the API, and the token is only ever handled by the half
 * that the browser cannot inspect.
 *
 * Two forwarding problems fall out of that, and both are handled here so no
 * caller has to remember them:
 *
 * 1. **Cookies out.** `fetch` on the server has no cookie jar. Without copying
 *    the incoming `Cookie` header onto the outgoing request, every authenticated
 *    call reaches the API anonymously and 401s, which presents as "signed in,
 *    but nothing loads".
 * 2. **Cookies back.** The API answers sign-in with `Set-Cookie` for
 *    `tizello_access` and `tizello_refresh`. Those headers are on the response
 *    Next received, not on the one the browser gets, so they have to be re-set
 *    through `next/headers` or the session evaporates the moment the action
 *    returns.
 */

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:5000/api/v1";

/** The API's envelope — identical for success and failure. */
export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
};

/**
 * What every call returns. The error branch carries `code`, not `message`:
 * the UI renders copy from `AUTH_ERROR_COPY` and never shows a server string,
 * so a backend change cannot leak an internal sentence into the page.
 */
export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; code: string; details?: unknown };

/**
 * Splits a `Set-Cookie` header into individual cookies.
 *
 * A plain `.split(",")` is wrong and fails intermittently: the `Expires`
 * attribute contains a comma (`Expires=Wed, 09 Jun 2027 …`), so naive splitting
 * tears one cookie into two malformed halves. `getSetCookie()` is the correct
 * API and is used when available; this is the fallback, splitting only on a
 * comma that is followed by something shaped like `name=`.
 */
function splitSetCookie(header: string): string[] {
  return header.split(/,(?=\s*[^=;,\s]+\s*=)/);
}

/**
 * Copies the API's `Set-Cookie` headers onto the response Next is building.
 *
 * Attributes are read back off each cookie rather than re-invented, with one
 * deliberate exception: **the refresh cookie is re-scoped to `path=/`.**
 *
 * The backend scopes `tizello_refresh` to `/api/v1/auth/refresh` so a browser
 * talking straight to the API sends it to that one endpoint. Nothing here talks
 * straight to the API — the browser talks to Next, Next talks to the API — so
 * on *this* origin that path matches no route the browser will ever request,
 * which means the cookie is never sent back to Next, never forwarded on, and
 * the refresh call silently authenticates as nobody. The session then dies with
 * the access token instead of living as long as the refresh token, and the user
 * is asked to sign in every fifteen minutes.
 *
 * It stays `httpOnly` and `secure`, so page JavaScript still cannot read it —
 * the narrow path bought nothing across an origin the API doesn't serve.
 */
const PATH_SCOPED_TO_API = /^\/api\//;
async function forwardSetCookies(response: Response): Promise<string> {
  const raw =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : splitSetCookie(response.headers.get("set-cookie") ?? "");

  if (raw.length === 0) return "";

  const jar = await cookies();
  const pairs: string[] = [];

  for (const line of raw) {
    const [pair, ...attributes] = line.split(";");
    const index = pair.indexOf("=");
    if (index < 0) continue;

    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();

    const options: Parameters<typeof jar.set>[2] = {};

    for (const attribute of attributes) {
      const [key, ...rest] = attribute.split("=");
      const flag = key.trim().toLowerCase();
      const detail = rest.join("=").trim();

      if (flag === "path") options.path = PATH_SCOPED_TO_API.test(detail) ? "/" : detail;
      else if (flag === "domain") options.domain = detail;
      else if (flag === "max-age") options.maxAge = Number(detail);
      else if (flag === "expires") options.expires = new Date(detail);
      else if (flag === "httponly") options.httpOnly = true;
      else if (flag === "secure") options.secure = true;
      else if (flag === "samesite") {
        options.sameSite = detail.toLowerCase() as "lax" | "strict" | "none";
      }
    }

    pairs.push(`${name}=${value}`);

    try {
      jar.set(name, value, options);
    } catch {
      /* Next only allows a cookie write from a Server Action or Route Handler.
         A silent renewal fired from a Server *Component* render therefore
         cannot persist the new pair — but it is still valid for the rest of
         this request, which is what the returned header is for. The browser
         keeps the old cookies and renews again on the next action. Throwing
         here instead would turn "the access token lapsed" into a 500 page. */
    }
  }

  return pairs.join("; ");
}

type CallOptions = {
  method?: string;
  body?: unknown;
  /**
   * Whether to copy `Set-Cookie` back to the browser. Only sign-in-shaped calls
   * need it, and a Server *Component* cannot set cookies at all — Next throws —
   * so this defaults to false and the actions that need it opt in.
   */
  forwardCookies?: boolean;
  cache?: RequestCache;
  /**
   * Sent instead of this request's own cookies. Used for the one retry after a
   * refresh: the renewed pair may not have been writable to the jar (see
   * `forwardSetCookies`), so the retry has to carry it explicitly or it just
   * replays the expired token and 401s again.
   */
  cookieOverride?: string;
  /** Receives the cookies this response set, as a `Cookie` header value. */
  onCookies?: (header: string) => void;
};

/**
 * Calls the API and normalizes the result.
 *
 * A network failure becomes `SERVER_ERROR` rather than an exception: these run
 * inside Server Actions whose return value is rendered, and an unhandled throw
 * there produces a full error page instead of a form-level message.
 */
export async function apiCall<T>(
  path: string,
  {
    method = "GET",
    body,
    forwardCookies = false,
    cache = "no-store",
    cookieOverride,
    onCookies,
  }: CallOptions = {},
): Promise<ApiResult<T>> {
  const jar = await cookies();

  const cookieHeader =
    cookieOverride ??
    jar
      .getAll()
      .map(({ name, value }) => `${name}=${value}`)
      .join("; ");

  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      // Never cached. A stale hit on this surface means a revoked session still
      // answering — see docs/api/auth.md §Caching.
      cache,
    });
  } catch (error) {
    /* The API is unreachable — wrong port, not started, DNS, TLS. This is the
       single most common cause of a bare "Something went wrong" on screen, and
       swallowing it silently makes it undiagnosable: the UI shows a generic
       sentence and the terminal shows nothing at all. Node nests the useful
       part in `cause` (ECONNREFUSED, EAI_AGAIN), so both are printed. */
    console.error(
      `[api] ${method} ${API_BASE}${path} — request failed:`,
      (error as Error)?.message,
      (error as { cause?: unknown })?.cause ?? "",
    );

    return { ok: false, status: 0, code: "SERVER_ERROR" };
  }

  if (forwardCookies) onCookies?.(await forwardSetCookies(response));

  // 204 has no body; parsing it throws.
  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }

  // Read as text ONCE, then parse that text — never `response.json()` followed
  // by `response.clone()` in the catch. `.json()` disturbs the body stream as
  // it reads, and `Response.clone()` is only legal on a stream nothing has
  // started reading yet: calling it after a failed `.json()` throws its own
  // "Body has already been consumed" TypeError, which then masked the ORIGINAL
  // parse failure and turned a diagnosable 404 into a raw 500 page.
  const raw = await response.text();

  let envelope: ApiEnvelope<T> | null = null;

  try {
    envelope = JSON.parse(raw) as ApiEnvelope<T>;
  } catch {
    /* Reached something that is not our API. The giveaway is almost always an
       HTML error page — another service on the port, or a proxy — so the first
       line of the body is logged: it identifies the impostor immediately,
       where "SERVER_ERROR" identifies nothing. */
    console.error(
      `[api] ${method} ${API_BASE}${path} — HTTP ${response.status} but the body is not JSON. ` +
        `Is something else listening on that port? Body starts: ` +
        raw.slice(0, 120).replace(/\s+/g, " "),
    );

    return { ok: false, status: response.status, code: "SERVER_ERROR" };
  }

  if (!response.ok || !envelope?.success) {
    const data = envelope?.data as { code?: string; details?: unknown } | null;

    return {
      ok: false,
      status: response.status,
      // `data.code`, never `error.code` — plan §2.2. Reading the wrong key here
      // yields `undefined`, which falls through every branch in the UI and
      // renders the generic message for errors that had a precise one.
      code: data?.code ?? "SERVER_ERROR",
      details: data?.details,
    };
  }

  return { ok: true, status: response.status, data: envelope.data as T };
}

/**
 * Calls the API and, on any 401, refreshes once and retries once.
 *
 * **Capped at exactly one retry, and that cap is the point.** The classic way
 * this cutover takes a site down is a refresh loop: every request 401s, each one
 * fires a refresh, each refresh 401s, and the app melts down under its own
 * traffic. A second 401 after a successful refresh means the session is genuinely
 * gone, and the caller signs the user out.
 *
 * Every 401 is retried, not only `TOKEN_EXPIRED`. The access token is the short
 * -lived half of the pair, so an expired *or* absent one — the browser drops the
 * cookie at its own max-age, which produces a "no token" 401 rather than an
 * "expired token" one — is exactly the case the refresh token exists to cover.
 * Only the refresh token's own expiry ends the session; the retry cap is what
 * keeps that from looping.
 */
export async function apiCallWithRefresh<T>(
  path: string,
  options: CallOptions = {},
): Promise<ApiResult<T>> {
  const first = await apiCall<T>(path, options);

  if (first.ok || first.status !== 401) {
    return first;
  }

  /* No refresh token, nothing to renew with — this is a signed-out visitor, not
     a lapsed session, and firing the refresh call for them just adds a round
     trip to every anonymous page load. */
  const jar = await cookies();
  if (!jar.has(REFRESH_COOKIE)) return first;

  let renewed = "";
  const refreshed = await apiCall<unknown>("/auth/refresh", {
    method: "POST",
    forwardCookies: true,
    onCookies: (header) => {
      renewed = header;
    },
  });

  if (!refreshed.ok) return first;

  return apiCall<T>(path, { ...options, ...(renewed ? { cookieOverride: renewed } : {}) });
}

export { API_BASE };
