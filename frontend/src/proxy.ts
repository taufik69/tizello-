import { NextResponse, type NextRequest } from "next/server";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/session-cookie";

/*
 * Route protection (Next 16 renamed middleware to proxy).
 *
 * This is an optimistic check and nothing more: it looks for the *presence* of
 * the session cookie, which is cheap and runs on every matched request. Real
 * validation happens in the page, where `getSession()` resolves the cookie to a
 * user. Treating a proxy check as authorisation would be a mistake — a cookie
 * with any value at all passes here.
 */
export function proxy(request: NextRequest) {
  /* Either cookie is enough to let the request through. The access cookie is
     the short-lived half and the browser drops it at its own max-age; bouncing
     on that alone signs out a user whose refresh token is still perfectly good,
     which is the whole thing the refresh token exists to prevent. `getSession()`
     downstream renews through `apiCallWithRefresh` and only genuinely fails
     once the refresh token has expired too. */
  if (request.cookies.has(SESSION_COOKIE) || request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.next();
  }

  /* A Server Action POST is not a navigation, and redirecting one hands React
     an HTML sign-in page where it expects a Flight stream — which surfaces as
     the opaque "An unexpected response was received from the server" runtime
     error rather than a sign-in bounce. Let it through instead: the action's
     own API call 401s, returns a code, and the caller renders that. */
  if (request.headers.has("next-action")) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = "";
  /* Where they were going, so signing in returns them there. Set through
     searchParams so the value is encoded once and cannot smuggle a second
     parameter; `safeNextPath` rejects anything that is not a relative path
     when it is read back. */
  url.searchParams.set("next", request.nextUrl.pathname);

  return NextResponse.redirect(url, 307);
}

export const config = {
  // `/workspaces` joined `/board` here once its data stopped being a fixture:
  // an unauthenticated call to the real API 401s, and without this guard that
  // read as "you have zero workspaces" instead of a sign-in redirect.
  matcher: ["/board/:path*", "/workspaces/:path*"],
};
