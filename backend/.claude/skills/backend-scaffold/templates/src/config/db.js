import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import config from './env.js';
import { createLogger } from './logger.js';

const log = createLogger('db');

// Prisma client singleton. One PrismaClient per process — each instance owns
// its own connection pool, so constructing them per-request (or per hot
// reload under nodemon) exhausts Postgres connections. The globalThis cache
// is what survives nodemon's module re-evaluation in development; in
// production the module cache alone is enough, but the same code path is
// used so there is only one behaviour to reason about.

const globalForPrisma = globalThis;

// Prisma 7 no longer reads `url` from schema.prisma — a direct database
// connection is made through a driver adapter, here node-postgres. The CLI
// reads its own copy of the URL from prisma.config.js; this is the one the
// running app uses.
const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// `emit: 'event'` rather than Prisma's default `'stdout'`: left on stdout,
// Prisma writes its own unstructured, unleveled lines that bypass pino
// entirely — unfilterable, and invalid NDJSON in the middle of the stream a
// collector is parsing. As events they become ordinary log records.
const prisma =
  globalForPrisma.__prisma ??
  new PrismaClient({
    adapter,
    log:
      config.nodeEnv === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'warn' },
            { emit: 'event', level: 'error' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

// Guarded by the same flag that stores the singleton: nodemon re-evaluates
// this module on every reload, and re-subscribing to a client that survived
// in globalThis would stack a duplicate listener per reload until Node warns
// about a leak and every query logs n times.
if (!globalForPrisma.__prismaLogging) {
  globalForPrisma.__prismaLogging = true;

  if (config.nodeEnv === 'development') {
    prisma.$on('query', (event) => {
      log.debug({ query: event.query, params: event.params, duration: event.duration }, 'query');
    });
    prisma.$on('warn', (event) => log.warn(event.message));
  }

  prisma.$on('error', (event) => log.error(event.message));
}

if (config.nodeEnv !== 'production') {
  globalForPrisma.__prisma = prisma;
}

// Called once at startup (index.js). Prisma connects lazily on first query,
// but connecting explicitly here means a bad DATABASE_URL fails at boot
// instead of surfacing as a 500 on the first real request.
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    log.info('Postgres connected successfully');
  } catch (error) {
    log.error({ err: error }, 'Postgres connection failed');
    throw error;
  }
};

const disconnectDatabase = async () => {
  await prisma.$disconnect();
};

export { prisma, connectDatabase, disconnectDatabase };
export default prisma;
