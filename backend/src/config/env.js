import dotenv from 'dotenv';

dotenv.config();

// This is the ONLY file in the project allowed to read process.env directly.
// Every other file imports `config` from here instead. Keeping the read in
// one place is what makes the fail-fast check below meaningful — a var that
// is read somewhere else can go missing without this list noticing.

const REQUIRED_ENV_VARS = ['PORT', 'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET'];

const missingVars = REQUIRED_ENV_VARS.filter((key) => {
  const value = process.env[key];
  return value === undefined || value === null || value === '';
});

if (missingVars.length > 0) {
  // Fail fast: an incompletely configured environment must never boot.
  //
  // This is the one deliberate `console.error` left in the codebase —
  // everything else logs through src/config/logger.js. The logger is
  // configured *from* this file, so importing it here would be a cycle, and
  // at this point in startup there is no configured logger to use anyway.
  console.error(
    `[env] Missing required environment variable(s): ${missingVars.join(', ')}. ` +
      'Check your .env file against .env.example.'
  );
  process.exit(1);
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  // Browser origin allowed through CORS. Optional — a dev machine without it
  // boots permissive rather than refusing to start.
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  // Pino's level threshold (src/config/logger.js). Optional: development
  // defaults to `debug` so a local run shows query-level detail, production
  // to `info` so it does not pay to format lines nobody reads.
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // bcrypt work factor for password hashes. Spec §9 sets 12 as a floor, not a
  // target: raising it is always safe, lowering it silently weakens every hash
  // written afterwards while leaving the old ones alone, so the `Math.max`
  // makes the floor unbypassable from the environment.
  bcryptCost: Math.max(12, Number(process.env.BCRYPT_COST) || 12),

  // Token and session lifetimes (plan §4.1, §11). The access token's bound is
  // JWT_EXPIRY above; these are the ones that are not JWTs.
  auth: {
    // The refresh token is opaque CSPRNG bytes, not a JWT — nothing signs it,
    // so its lifetime is enforced by the row, not by a claim.
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30,
    // Six digits is only 10^6, so the attempt cap — not the length — is what
    // makes the code safe. Both are enforced on the LoginCode row.
    loginCodeTtlMinutes: Number(process.env.LOGIN_CODE_TTL_MINUTES) || 10,
    loginCodeMaxAttempts: Number(process.env.LOGIN_CODE_MAX_ATTEMPTS) || 5,
    emailVerifyTtlHours: Number(process.env.EMAIL_VERIFY_TTL_HOURS) || 24,
    passwordResetTtlHours: Number(process.env.PASSWORD_RESET_TTL_HOURS) || 1,
  },

  // Invitations (plan §3.6, §8).
  invite: {
    // 7 days must match the shipped frontend copy, "Invitation links last
    // seven days." Change one and the other becomes a lie.
    ttlDays: Number(process.env.INVITE_TTL_DAYS) || 7,
    // Per-workspace hourly cap: an admin mass-inviting sends mail from our
    // domain to strangers, so this is a spam-reputation guard keyed on the
    // workspace, which is the unit doing the sending.
    maxPerWorkspaceHour: Number(process.env.INVITE_MAX_PER_WORKSPACE_HOUR) || 50,
  },

  // Auth cookies (plan §4.1, §11.1). Undefined — not '' — when unset: Express
  // omits the Domain attribute entirely for undefined, giving a host-only
  // cookie, which is the correct and narrowest scope for localhost. An empty
  // string would be serialized as `Domain=`, which browsers reject.
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  // SMTP transport for the email worker (src/shared/utils/mailer.js). Read
  // here like everything else, but deliberately absent from REQUIRED_ENV_VARS:
  // the API server never sends mail — it enqueues — so a developer without
  // credentials must still be able to boot it. The worker enforces its own
  // requirement at startup instead, where the absence actually matters.
  mail: {
    // Gmail authenticates the envelope sender, so one address is both the
    // SMTP user and the From. Two separate vars would let them drift apart
    // and Gmail would silently rewrite the From back to the authenticated
    // account anyway.
    user: process.env.HOST_MAIL || '',
    // App Password, not the account password — Gmail refuses the latter over
    // SMTP. Google prints it in four space-separated groups and accepts it
    // either way, so the spaces are stripped rather than trusted.
    password: (process.env.HOST_APP_PASSWORD || '').replace(/\s+/g, ''),
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    // Implicit TLS (port 465) vs STARTTLS (port 587). Only 'true' counts:
    // any other string, including 'false', is truthy on its own.
    secure: process.env.SMTP_SECURE === 'true',
    fromName: process.env.MAIL_FROM_NAME || 'Tizello',
  },
  // OAuth provider credentials (plan §5, sprint 5). Absent from
  // REQUIRED_ENV_VARS on purpose: a developer with no provider keys must
  // still boot and work on password auth, so `src/config/passport.js`
  // registers a strategy only when `isConfigured` is true for it and the
  // provider's routes 404 otherwise.
  //
  // `callbackUrl` is a whole URL, not a path joined to a base at runtime.
  // The provider console stores this string and compares it character for
  // character; keeping it whole means the value here is the value you paste
  // into the console, with nothing assembled in between to disagree.
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
      get isConfigured() {
        return Boolean(this.clientId && this.clientSecret);
      },
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/github/callback',
      get isConfigured() {
        return Boolean(this.clientId && this.clientSecret);
      },
    },
  },
};

export default config;
