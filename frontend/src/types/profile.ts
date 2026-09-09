/**
 * The account's own profile. Mirrors `profile` in
 * `backend/docs/api/user.md` — a superset of `User` in `types/auth.ts`, and
 * deliberately a separate type.
 *
 * `User` is the session shape: what `getSession()` returns, what every screen
 * with a signed-in header reads. This is the profile screen's shape, read on
 * one route. Merging them would put a phone number into every page's payload,
 * which is what the API declines to do on its side (`toUser` vs `toProfile`).
 *
 * Every editable field is nullable, because the API's are: an account created
 * by accepting an invitation has never been asked for a name, and a nickname
 * that has been cleared is `null`, not `""`.
 */
export type Profile = {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  /** A path like `/uploads/<uuid>.png`, not a full URL — see `avatarSrc`. */
  avatarUrl: string | null;
  emailVerified: boolean;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
};

/** The fields `PATCH /users/me` accepts. `null` clears; omitted leaves alone. */
export type ProfileInput = {
  name?: string | null;
  nickname?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

/**
 * Copy for the codes `PATCH /users/me` can return. Keyed the way
 * `AUTH_ERROR_COPY` and `INVITE_ERROR_COPY` are, and for the same reason: the
 * API returns `data.code` and the UI supplies the words, so no server-authored
 * string ever reaches the page.
 */
const PROFILE_ERROR_COPY: Record<string, string> = {
  VALIDATION_ERROR: "Check the fields and try again.",
  NOT_FOUND: "That account no longer exists.",
  TOKEN_INVALID: "Your session has expired. Sign in again.",
  RATE_LIMITED: "Too many changes. Try again in a moment.",
  SERVER_ERROR: "Something went wrong. Try again.",
};

export function profileErrorCopy(code: string): string {
  return PROFILE_ERROR_COPY[code] ?? PROFILE_ERROR_COPY.SERVER_ERROR;
}
