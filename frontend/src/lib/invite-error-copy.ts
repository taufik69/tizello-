/*
 * Copy for the invitation error codes, as a plain module.
 *
 * **Deliberately not in `lib/actions/invitation-actions.ts`.** Every export of
 * a `"use server"` file becomes a server action, so a lookup table living there
 * would cost a network round-trip every time a toast needed a sentence — a
 * request, to read a constant, to render an error that has already happened.
 *
 * Keyed the same way `AUTH_ERROR_COPY` is, and for the same reason: the API
 * returns `data.code` and the UI supplies the words, so no server-authored
 * string ever reaches the page.
 */

const INVITE_ERROR_COPY: Record<string, string> = {
  ALREADY_MEMBER: "That person is already in this workspace.",
  INVITE_PENDING: "An invitation is already pending for that address.",
  INVITE_EMAIL_MISMATCH:
    "This invitation was sent to a different address. Sign in as that address to accept.",
  EMAIL_NOT_VERIFIED: "Verify your email address before joining a workspace.",
  FORBIDDEN: "You do not have permission to invite people here.",
  NOT_FOUND: "That invitation is no longer valid.",
  TOKEN_EXPIRED: "That invitation has expired. Ask for a new one.",
  VALIDATION_ERROR: "Check the address and try again.",
  RATE_LIMITED: "Too many invitations sent. Try again in a little while.",
  SERVER_ERROR: "Something went wrong. Try again.",
};

/** Falls back to the generic sentence, so an unmapped code still renders. */
export function inviteErrorCopy(code: string): string {
  return INVITE_ERROR_COPY[code] ?? INVITE_ERROR_COPY.SERVER_ERROR;
}
