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
};

export default config;
