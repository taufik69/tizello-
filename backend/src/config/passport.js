/**
 * Passport strategy registration for Google and GitHub.
 *
 * **`session: false` everywhere.** Passport's session support would install a
 * second, competing session mechanism beside our cookies and refresh-token
 * rows — two sources of truth about who is signed in, only one of which can be
 * revoked. `passport.initialize()` is mounted in app.js and
 * `passport.session()` is not.
 *
 * **A strategy registers only when its credential pair is present.** A developer
 * with no Google keys must still be able to boot and work on password auth
 * (plan §11), so absence is a normal state, not a misconfiguration — the
 * provider's routes 404 and everything else runs.
 *
 * The verify callbacks hold no business logic. Each one normalizes its
 * provider's profile into the same four facts and hands them to
 * `auth.oauth.service.js`; the linking rules live there, once, where they can
 * be reasoned about without a provider SDK in the way.
 *
 * See .claude/specs/auth/auth.sprint5.md §5.1 and .claude/plan/authentication.md §5
 */

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import config from './env.js';
import { createLogger } from './logger.js';
import oauthService from '../modules/auth/auth.oauth.service.js';

const log = createLogger('passport');

/**
 * Reads Google's verified flag.
 *
 * Passport's *normalized* `profile.emails[]` drops `email_verified` — it
 * survives only on `profile._json`, the raw OIDC claims. Reading the normalized
 * profile and finding no `verified` field looks like "Google does not tell us",
 * when in fact it did and the value was discarded one object up.
 *
 * The explicit comparison is the second half. Google returns the claim as a
 * boolean in some flows and the *string* `"true"` in others, so a truthiness
 * test also passes for `"false"` — every non-empty string is truthy. This is a
 * fail-open bug that looks like working code.
 */
const googleEmailVerified = (profile) => {
  const claim = profile?._json?.email_verified;
  return claim === true || claim === 'true';
};

/**
 * Reads GitHub's verified flag, which requires a second API call.
 *
 * GitHub's profile carries no verification status at all. The `user:email`
 * scope grants `GET /user/emails`, which returns `{ email, primary, verified }`
 * per address — so the flag has to be fetched, not read off `profile`.
 *
 * Any failure here returns `verified: false`. That is deliberate: a network
 * error, a revoked scope or a rate limit must not be allowed to look like
 * "verified", because the caller uses this to decide whether to link an
 * identity to an existing account.
 */
const fetchGitHubPrimaryEmail = async (accessToken) => {
  try {
    const response = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Tizello',
      },
    });

    if (!response.ok) {
      log.warn({ status: response.status }, 'GitHub /user/emails failed');
      return { email: null, emailVerified: false };
    }

    const emails = await response.json();
    const primary = Array.isArray(emails) ? emails.find((entry) => entry.primary) : null;

    return {
      email: primary?.email?.toLowerCase() ?? null,
      emailVerified: primary?.verified === true,
    };
  } catch (error) {
    log.warn({ err: error }, 'GitHub /user/emails threw');
    return { email: null, emailVerified: false };
  }
};

/**
 * Adapts a normalized profile to Passport's `done` callback.
 *
 * An `AppError` from the service (an unverified provider email) travels as an
 * error, which the callback route turns into a redirect carrying its code —
 * never JSON, because the browser is mid-navigation.
 */
const verify = async (facts, done) => {
  try {
    done(null, await oauthService.resolveOAuthUser(facts));
  } catch (error) {
    done(error);
  }
};

if (config.oauth.google.isConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackUrl,
        // Without the `email` scope there is no address at all — not an
        // unverified one, none — and every sign-in would fail at the linking
        // step for a reason that reads like a bug.
        scope: ['profile', 'email'],
      },
      (accessToken, refreshToken, profile, done) =>
        verify(
          {
            provider: 'GOOGLE',
            // The OIDC `sub`. Stable across email changes at Google; the email
            // is not, which is why this is the lookup key.
            providerAccountId: profile.id,
            email: profile.emails?.[0]?.value?.toLowerCase() ?? null,
            emailVerified: googleEmailVerified(profile),
            name: profile.displayName ?? null,
          },
          done
        )
    )
  );

  log.info('Google OAuth strategy registered');
} else {
  log.warn('Google OAuth not configured — /api/v1/auth/google/* will 404');
}

if (config.oauth.github.isConfigured) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientId,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackUrl,
        // Required, and silently consequential: without it `/user/emails` is
        // forbidden, every address reads as unverified, and every new GitHub
        // sign-in is refused.
        scope: ['user:email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        const { email, emailVerified } = await fetchGitHubPrimaryEmail(accessToken);

        return verify(
          {
            provider: 'GITHUB',
            providerAccountId: String(profile.id),
            email,
            emailVerified,
            name: profile.displayName || profile.username || null,
          },
          done
        );
      }
    )
  );

  log.info('GitHub OAuth strategy registered');
} else {
  log.warn('GitHub OAuth not configured — /api/v1/auth/github/* will 404');
}

/**
 * Which providers actually registered. The routes layer reads this to decide
 * whether to mount a provider's endpoints at all, so an unconfigured provider
 * 404s rather than throwing "Unknown authentication strategy" as a 500.
 */
const isProviderEnabled = (provider) => Boolean(config.oauth[provider]?.isConfigured);

export { passport, isProviderEnabled, googleEmailVerified, fetchGitHubPrimaryEmail };
export default passport;
