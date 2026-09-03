import { NextResponse, type NextRequest } from "next/server";
import { SKIP_AUTH } from "@/lib/demo-auth";
import { SESSION_COOKIE } from "@/lib/session-cookie";

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
  /* TEMP: see `lib/demo-auth.ts`. */
  if (SKIP_AUTH) return NextResponse.next();

  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

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
  matcher: "/board/:path*",
};
