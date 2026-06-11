const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;
let isRedisMock = false;

// Custom In-Memory Redis Mock Fallback
class MemoryRedisMock {
  constructor() {
    this.store = {};
    logger.warn('Running Redis in Simulation Mode (In-Memory Fallback)');
  }

  async get(key) {
    return this.store[key] || null;
  }

  async set(key, value, expiryMode, time) {
    this.store[key] = value;
    if (expiryMode === 'EX' && time) {
      setTimeout(() => {
        delete this.store[key];
      }, time * 1000);
    }
    return 'OK';
  }

  async del(key) {
    if (this.store[key]) {
      delete this.store[key];
      return 1;
    }
    return 0;
  }

  async keys(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Object.keys(this.store).filter(key => regex.test(key));
  }

  async zadd(key, score, member) {
    if (!this.store[key]) this.store[key] = [];
    // remove existing if present
    this.store[key] = this.store[key].filter(item => item.member !== member);
    this.store[key].push({ score: parseFloat(score), member });
    // sort descending
    this.store[key].sort((a, b) => b.score - a.score);
    return 1;
  }

  async zrevrange(key, start, stop, withScores) {
    const list = this.store[key] || [];
    const sliced = list.slice(start, stop === -1 ? undefined : stop + 1);
    if (withScores === 'WITHSCORES') {
      const result = [];
      for (const item of sliced) {
        result.push(item.member, String(item.score));
      }
      return result;
    }
    return sliced.map(item => item.member);
  }

  async quit() {
    return 'OK';
  }
}

if (process.env.USE_REDIS_MOCK === 'true' || !process.env.REDIS_URL) {
  redisClient = new MemoryRedisMock();
  isRedisMock = true;
} else {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn(`Redis unreachable after ${times} attempts — stopping retries, will use mock.`);
          return null; // stop retrying
        }
        return Math.min(times * 500, 2000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('Redis connection established successfully.');
    });

    let failoverDone = false;
    redisClient.on('error', (err) => {
      if (!failoverDone) {
        logger.error(`Redis encountered an error: ${err.message}`);
        failoverDone = true;
        logger.warn('Switching to In-Memory Redis client due to connection failure.');
        try { redisClient.disconnect(); } catch (_) {}
        redisClient = new MemoryRedisMock();
        isRedisMock = true;
      }
    });

    redisClient.connect().catch(() => { /* handled via error event above */ });
  } catch (error) {
    logger.error('Failed to construct Redis client: %O', error);
    redisClient = new MemoryRedisMock();
    isRedisMock = true;
  }
}

module.exports = {
  redisClient,
  isRedisMock: () => isRedisMock
};
