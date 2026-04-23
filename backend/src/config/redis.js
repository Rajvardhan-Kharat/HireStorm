const { Redis } = require('ioredis');

/**
 * Shared Redis connection for BullMQ.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_URL is set (production),
 * falls back to the local REDIS_URL (development).
 *
 * BullMQ requires `maxRetriesPerRequest: null` on the ioredis connection.
 */
const redisUrl = process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck:     false,
  // Upstash TLS: ioredis auto-detects rediss:// scheme
  tls: redisUrl.startsWith('rediss://') ? {} : undefined,
});

connection.on('connect', () => console.log('✅ Redis connected (BullMQ)'));
connection.on('error',   (err) => console.error('❌ Redis error:', err.message));

module.exports = connection;
