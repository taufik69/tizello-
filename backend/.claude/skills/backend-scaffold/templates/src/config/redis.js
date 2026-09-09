import Redis from 'ioredis';
import config from './env.js';
import { createLogger } from './logger.js';

const log = createLogger('redis');

// Redis client using ioredis and REDIS_URL from env.js (never process.env
// directly). Mirrors db.js's shape: a client plus an explicit connect
// function with clear error-event handling.
const redisClient = new Redis(config.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redisClient.on('error', (error) => {
  log.error({ err: error }, 'Redis connection error');
});

redisClient.on('connect', () => {
  log.info('Redis connected successfully');
});

// `lazyConnect` above would otherwise defer the connection to the first
// command, letting the server boot "successfully" with a dead Redis and only
// failing much later. Connecting here makes Redis fail at startup like the
// database does.
const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    log.error({ err: error }, 'Redis connection failed');
    throw error;
  }
};

// BullMQ requires its own ioredis instance with maxRetriesPerRequest set to
// null — it manages retries itself for blocking commands. It cannot share
// redisClient above, which sets a retry limit for ordinary app use.
const connection = new Redis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on('error', (error) => {
  log.error({ err: error }, 'BullMQ connection error');
});

// Alias for general-purpose app caching — same client as redisClient, just
// named for its use case at the call site.
const cache = redisClient;

export { redisClient, connectRedis, connection, cache };
export default redisClient;
