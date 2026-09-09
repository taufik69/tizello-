/**
 * The closed set of machine-readable error codes the auth and invitation
 * surfaces may return, mirroring `AUTH_ERROR_CODES` in
 * `frontend/src/types/auth.ts`.
 *
 * **The frontend renders copy from the code and ignores `message` entirely.**
 * That is what stops a backend string from ever reaching a user's screen, and
 * it means an error shipped without a code — or with one the frontend's union
 * does not contain — is not "less helpful", it is unrenderable: the UI has no
 * branch for it. Every `AppError` on these paths passes one.
 *
 * The two halves of this file are not equal:
 *   - `AUTH_ERROR_CODES` must stay byte-identical to the frontend union.
 *   - The codes below it are backend additions the frontend does not yet know
 *     about; each needs adding to that union and to `AUTH_ERROR_COPY` before
 *     the endpoint that returns it can render. Sprint 8 §8.5 and sprint 9
 *     track `INVITE_EMAIL_MISMATCH` specifically.
 *
 * See .claude/specs/auth/auth.sprint1.md §1.5 and .claude/plan/authentication.md §2.2
 */

const AUTH_CODES = {
  // --- Mirrors frontend/src/types/auth.ts exactly. Do not diverge. ---

  // Deliberately ambiguous between "no such account" and "wrong password".
  // Spec §8 calls that ambiguity the enumeration defence: splitting it into
  // two honest messages hands an attacker a user-list oracle. The dummy-hash
  // comparison in tokens.js is what keeps the timing ambiguous too.
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  // An accepted enumeration leak, unlike the above: registration cannot both
  // report a duplicate and stay silent about it. Rate limiting is the
  // mitigation here, not secrecy (spec §8).
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  CODE_INVALID: 'CODE_INVALID',
  CODE_EXPIRED: 'CODE_EXPIRED',
  // TOKEN_INVALID is a 400/401 and TOKEN_EXPIRED a 410/401: the split exists
  // because the frontend offers "request a new link" for one and not the
  // other. Never collapse them.
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',

  // --- Backend additions, not yet in the frontend union (sprint 1 §1.5) ---

  // Signed in as bob@personal.com, invitation addressed to bob@work.com. An
  // ordinary mistake with a dead-end failure mode, which is why sprint 8 §8.5
  // requires copy that names the address to sign in as.
  INVITE_EMAIL_MISMATCH: 'INVITE_EMAIL_MISMATCH',
  // Inviting someone who is already in the workspace. A token that could only
  // ever be a no-op should not be minted at all (§6.5).
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  // A live invitation for this address already exists — the partial unique
  // index in the sprint 1 migration is the database-level counterpart.
  INVITE_PENDING: 'INVITE_PENDING',
  // The provider authenticated someone but would not vouch for the address.
  // Linking on an unverified provider email hands over the matching account,
  // so this refuses rather than linking (plan §5.3).
  OAUTH_EMAIL_UNVERIFIED: 'OAUTH_EMAIL_UNVERIFIED',
  // Generic 403 for a permission failure, so authorization errors carry a code
  // like everything else.
  FORBIDDEN: 'FORBIDDEN',
  // Request shape failed the Joi schema. Field-level detail rides in
  // `data.details`; this is the form-level code.
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  // A unique constraint rejected the write. Generic on purpose: the auth and
  // invitation paths that care about a specific collision (EMAIL_TAKEN,
  // INVITE_PENDING, ALREADY_MEMBER) check for it themselves and throw the
  // precise code, so anything reaching this one is a collision nobody
  // anticipated.
  CONFLICT: 'CONFLICT',
};

/**
 * Maps a bare HTTP status onto a code, for the errors that are thrown without
 * one — a Prisma constraint violation, a 404 from the catch-all, an
 * unhandled throw. The client contract is that `data.code` is always present,
 * so the error middleware needs a defensible default rather than `undefined`.
 *
 * This is a fallback, never a substitute: an auth path that relies on it is
 * returning a code chosen by a status-code table instead of by the thing that
 * actually failed.
 */
const codeForStatus = (statusCode) => {
  switch (statusCode) {
    case 400:
      return AUTH_CODES.VALIDATION_ERROR;
    case 401:
      return AUTH_CODES.TOKEN_INVALID;
    case 403:
      return AUTH_CODES.FORBIDDEN;
    case 404:
      return AUTH_CODES.NOT_FOUND;
    case 409:
      return AUTH_CODES.CONFLICT;
    case 410:
      return AUTH_CODES.TOKEN_EXPIRED;
    case 422:
      return AUTH_CODES.VALIDATION_ERROR;
    case 429:
      return AUTH_CODES.RATE_LIMITED;
    default:
      return AUTH_CODES.SERVER_ERROR;
  }
};

export { AUTH_CODES, codeForStatus };
export default AUTH_CODES;
