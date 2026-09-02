/**
 * Auth domain types. Mirrors the `user` object in the API contract recorded in
 * `.claude/specs/authentication.md §9` — never a password hash, never a raw
 * token, because neither should ever cross into a component.
 */
export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  /** ISO timestamp. */
  createdAt: string;
};

/**
 * Every failure the auth surface can produce. Closed union: the UI maps a code
 * to copy (below) and never renders a server-supplied message, so a backend
 * change cannot leak an internal string into the page.
 */
export const AUTH_ERROR_CODES = [
  "INVALID_CREDENTIALS",
  "EMAIL_TAKEN",
  "EMAIL_NOT_VERIFIED",
  "WEAK_PASSWORD",
  "CODE_INVALID",
  "CODE_EXPIRED",
  "TOKEN_INVALID",
  "TOKEN_EXPIRED",
  "RATE_LIMITED",
  "SERVER_ERROR",
] as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[number];

export type AuthError = { code: AuthErrorCode; message: string };

/**
 * Spec §8. `INVALID_CREDENTIALS` is deliberately ambiguous between "no such
 * account" and "wrong password" — that ambiguity is the enumeration defence
 * and must not be split into two messages.
 */
export const AUTH_ERROR_COPY: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIALS: "That email or password isn't right.",
  EMAIL_TAKEN: "An account already uses this email. Log in instead.",
  EMAIL_NOT_VERIFIED: "Verify your email to continue.",
  WEAK_PASSWORD: "That password is too common. Try another.",
  CODE_INVALID: "That code isn't right. Check it and try again.",
  CODE_EXPIRED: "That code has expired. Send yourself a new one.",
  TOKEN_INVALID: "This link is no longer valid.",
  TOKEN_EXPIRED: "This link has expired.",
  RATE_LIMITED: "Too many attempts. Try again in a few minutes.",
  SERVER_ERROR: "Something went wrong. Try again.",
};

/** Which credential step 2 of sign-in is asking for. Code is the default. */
export type SignInMode = "code" | "password";

/**
 * What every auth Server Action returns. Serialisable by construction so it can
 * cross back into a `useActionState` client leaf.
 *
 * - `code`      — form-level failure, rendered through AUTH_ERROR_COPY
 * - `fieldErrors` — per-field messages, keyed by the input's `name`
 * - `done`      — the action succeeded without redirecting (resend, forgot)
 */
export type AuthFormState = {
  code?: AuthErrorCode;
  fieldErrors?: Record<string, string>;
  done?: boolean;
};
