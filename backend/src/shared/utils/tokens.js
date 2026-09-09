/**
 * Every secret the auth surface mints or verifies — access tokens, opaque
 * refresh/verification tokens, and six-digit login codes.
 *
 * The file exists so that one decision is made once: **which hash for which
 * secret**. It is deliberately not uniform, and the asymmetry is the point:
 *
 *   - `hashToken` is SHA-256, for the 256-bit CSPRNG tokens. There is no
 *     low-entropy input to slow an attacker down, and refresh runs on every
 *     access-token expiry — a 100ms KDF there is a tax on every active session
 *     bought for nothing.
 *   - `hashSixDigitCode` is bcrypt, for the 6-digit codes — shared by login
 *     codes and registration codes, since both are the same low-entropy
 *     shape. 10^6 candidates fall to a SHA-256 dictionary in milliseconds, so
 *     here the slow KDF is the whole defence.
 *
 * Reversing those two is the mistake this header exists to prevent. Neither is
 * a style choice.
 *
 * Nothing here reads the database or touches `res` — these are pure functions,
 * callable from a service, a worker, or a test.
 *
 * See .claude/specs/auth/auth.sprint1.md §1.3 and .claude/plan/authentication.md §3.3–§3.5
 */

import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../../config/env.js';

/**
 * Signs the short-lived access token.
 *
 * `sub` rather than `id` is the registered JWT claim for the subject, which is
 * what `authGuard` reads. `emailVerified` is carried in the payload so a guard
 * can refuse an unverified account without a database round trip on every
 * request — at the cost of being up to `JWT_EXPIRY` stale, which is acceptable
 * because verification only ever flips false → true.
 *
 * `fid` carries the refresh-token family this access token belongs to, and it
 * is what makes `/logout` possible at all. The refresh cookie is scoped to
 * `/api/v1/auth/refresh`, so the browser never sends it to `/logout` — without
 * a family id here, logout would have no way to tell WHICH session to revoke,
 * and would have to choose between revoking nothing or signing the user out of
 * every device. It is not a secret: it names a session, and holding it grants
 * nothing without the signature around it.
 *
 * Never put anything here that must be revocable: an access token is not
 * checked against the database, so a claim is true until the token expires.
 */
const signAccessToken = (user, { familyId } = {}) =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
      emailVerified: user.emailVerifiedAt !== null && user.emailVerifiedAt !== undefined,
      ...(familyId ? { fid: familyId } : {}),
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry, algorithm: 'HS256' }
  );

/**
 * Verifies an access token and returns its payload, throwing jsonwebtoken's
 * own `TokenExpiredError` / `JsonWebTokenError` for the caller to translate.
 *
 * `clockTolerance: 60` is not defensive padding — it is required. A 15-minute
 * token issued by one instance and verified by another whose clock is a few
 * seconds ahead is rejected at random near expiry, which reads to a user as
 * "signed out for no reason" and is nearly impossible to reproduce.
 *
 * `algorithms` is pinned: without it, a token whose header says `alg: none`
 * is accepted as unsigned by some verifiers. Ours does not, but pinning costs
 * nothing and removes the class of bug entirely.
 */
const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], clockTolerance: 60 });

/**
 * Verifies the signature but accepts an expired token. **Only `/logout` may
 * use this.**
 *
 * Logout has to work with an expired access token — that is the entire reason
 * it takes no guard — but it still needs the `fid` claim to know which session
 * to revoke. Ignoring `exp` while still checking the HMAC keeps that readable
 * without trusting anything unsigned: a forged token still fails, an expired one
 * still identifies its own session.
 *
 * Anywhere else this would be a vulnerability, because it turns a 15-minute
 * bound into no bound at all.
 */
const verifyAccessTokenIgnoringExpiry = (token) =>
  jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], ignoreExpiration: true });

/**
 * 32 CSPRNG bytes as base64url — the refresh, verification and invitation
 * tokens.
 *
 * base64url, not hex or plain base64: an invitation token rides in a URL path
 * segment (`/invite/<token>`), and base64's `+` and `/` need escaping there
 * while base64url's `-` and `_` do not. Hex would be safe too but 64 characters
 * instead of 43 for the same entropy.
 *
 * 256 bits is far past guessable, which is what lets `hashToken` be a plain
 * SHA-256 rather than a KDF.
 */
const mintOpaqueToken = () => crypto.randomBytes(32).toString('base64url');

/**
 * SHA-256 hex of an opaque token — what gets stored, so that a database dump
 * is not a set of working credentials.
 *
 * Deterministic and unsalted **on purpose**: lookups are
 * `findUnique({ tokenHash })`, which a per-row salt would make impossible
 * without scanning every row and hashing against each. That is safe only
 * because the input is 256 bits of randomness; never reuse this function for
 * anything a human chose.
 */
const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

/**
 * A six-digit code, zero-padded — used for both login codes and registration
 * codes, which are the same shape.
 *
 * `crypto.randomInt` rather than `Math.random`: the latter is a seeded PRNG
 * whose output is predictable from previous values, which for a credential is
 * a vulnerability rather than a nitpick. The upper bound is exclusive, so
 * (0, 1000000) is exactly 000000–999999 — and the padding matters, because
 * `'004213'` is a valid code that `String(4213)` would corrupt.
 */
const mintSixDigitCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

/**
 * bcrypt-hashes a six-digit code. See the file header for why this is not
 * `hashToken`.
 */
const hashSixDigitCode = (code) => bcrypt.hash(code, config.bcryptCost);

/**
 * Compares a submitted code against a stored bcrypt hash in constant time
 * relative to the hash — bcrypt's own comparison, not `===`.
 */
const verifySixDigitCode = (code, codeHash) => bcrypt.compare(code, codeHash);

/**
 * Password hashing, kept beside the code helpers so every KDF call in the
 * codebase reads its cost from the same place.
 */
const hashPassword = (password) => bcrypt.hash(password, config.bcryptCost);
const verifyPassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

/**
 * A bcrypt hash of a value nobody knows, computed once at module load.
 *
 * Login compares against this when the account does not exist, so that a
 * missing account and a wrong password take the same time. Without it the
 * shared `INVALID_CREDENTIALS` message is undone by a timing oracle: an
 * unknown address returns in single-digit milliseconds while a real one pays
 * for a bcrypt comparison. Spec §8 calls the ambiguity the enumeration
 * defence — this is what makes it hold.
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);

/** A random family id for a new refresh-token lineage (one per sign-in). */
const mintFamilyId = () => crypto.randomUUID();

export {
  signAccessToken,
  verifyAccessToken,
  verifyAccessTokenIgnoringExpiry,
  mintOpaqueToken,
  hashToken,
  mintSixDigitCode,
  hashSixDigitCode,
  verifySixDigitCode,
  hashPassword,
  verifyPassword,
  mintFamilyId,
  DUMMY_PASSWORD_HASH,
};
