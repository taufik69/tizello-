/**
 * OAuth identity resolution — the §5.3 linking rules, split out of
 * `auth.service.js` deliberately (plan §12.3).
 *
 * **The rule this file exists to get right:** an OAuth identity is looked up by
 * `(provider, providerAccountId)` and *never* by email. A provider's subject id
 * is stable for the life of the account; an email address at that provider can
 * be changed, released, and re-registered by someone else. Matching on email
 * would mean that whoever holds an address today inherits the Tizello account
 * of whoever held it before.
 *
 * Email is used for exactly one thing — deciding whether a *new* provider
 * identity may be linked to an *existing* password account — and only when the
 * provider states the address is verified. If a provider let someone sign up as
 * `victim@example.com` without proving it, linking on that claim hands over the
 * victim's account. That is why `emailVerified` is read carefully per provider
 * (see config/passport.js) and why absent means false here, never "probably".
 *
 * See .claude/specs/auth/auth.sprint5.md §5.3 and docs/api/auth.md
 */

import AppError from '../../shared/utils/AppError.js';
import httpStatus from '../../shared/constants/httpStatus.js';
import { AUTH_CODES } from '../../shared/constants/authCodes.js';
import prisma from '../../config/db.js';
import repository from './auth.repository.js';

/**
 * Resolves a provider profile to a Tizello user, creating or linking as needed.
 *
 * ```
 * OAuthAccount(provider, providerAccountId) exists?  → sign that user in
 *    else provider says email verified?
 *         no  → 403 OAUTH_EMAIL_UNVERIFIED, do NOT link
 *         yes → User with that email exists?
 *                  yes → link: insert OAuthAccount → that user
 *                  no  → create User, emailVerifiedAt = now, passwordHash = null
 * ```
 */
const resolveOAuthUser = async ({ provider, providerAccountId, email, emailVerified, name }) => {
  // 1. Known identity. Nothing about the email matters here — this person has
  //    signed in through this provider before, and the link already exists.
  const linked = await repository.findOAuthAccount(provider, providerAccountId);
  if (linked) return linked.user;

  // 2. A new identity we cannot vouch for. Refuse rather than link or create:
  //    an unverified address is a claim, not a fact.
  if (!emailVerified || !email) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      'Your provider has not verified this email address',
      AUTH_CODES.OAUTH_EMAIL_UNVERIFIED
    );
  }

  const existing = await repository.findUserByEmail(email);

  // 3. Verified address matching a local account → link. One user row, two ways
  //    in. The alternative — a second account with the same address — is how
  //    "I can't see my boards" support tickets are born.
  if (existing) {
    await repository.createOAuthAccount({ userId: existing.id, provider, providerAccountId });

    // The provider vouched for an address this account had not yet proved.
    // That is exactly what a verification email establishes, so accept it.
    return existing.emailVerifiedAt
      ? existing
      : repository.updateUser(existing.id, { emailVerifiedAt: new Date() });
  }

  // 4. Brand new person. Created **already verified** — the provider vouched,
  //    and asking them to prove an address they just authenticated with is
  //    theatre. `passwordHash` stays null: this account has no password, which
  //    is why `login` and `forgotPassword` both check for one before acting.
  return prisma.$transaction(async (tx) => {
    const user = await repository.createUser(
      { email, name: name ?? null, emailVerifiedAt: new Date(), passwordHash: null },
      tx
    );

    await repository.createOAuthAccount({ userId: user.id, provider, providerAccountId }, tx);

    return user;
  });
};

export default { resolveOAuthUser };
export { resolveOAuthUser };
