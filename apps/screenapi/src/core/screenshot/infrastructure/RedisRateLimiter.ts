import Redis from 'ioredis';
import type {
  IRateLimiter,
  RateLimitResult,
} from '../application/interfaces/IRateLimiter';

interface MemoryEntry {
  count: number;
  expiresAt: number;
}

export class RedisRateLimiter implements IRateLimiter {
  private redis: Redis | null = null;
  private memoryStore: Map<string, MemoryEntry> = new Map();
  private useMock: boolean = false;

  constructor(redisUrl?: string) {
    if (redisUrl && redisUrl.trim() !== '') {
      try {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          lazyConnect: true,
        });

        this.redis.on('error', (err) => {
          console.error('Redis error:', err.message);
          console.warn('Falling back to in-memory rate limiter');
          this.useMock = true;
        });

        this.redis.on('connect', () => {
          console.log('Redis connected for rate limiting');
          this.useMock = false;
        });

        // Try to connect
        this.redis.connect().catch(() => {
          console.warn('Redis connection failed, using in-memory fallback');
          this.useMock = true;
        });
      } catch (error) {
        console.error('Failed to initialize Redis:', error);
        this.useMock = true;
      }
    } else {
      console.warn('No REDIS_URL provided, using in-memory rate limiter');
      this.useMock = true;
    }
  }

  async check(
    identifier: string,
    limit: number,
    windowSeconds: number = 60,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const key = `rate_limit:${identifier}`;

    if (this.useMock || !this.redis) {
      return this.checkMemory(key, limit, windowSeconds, now);
    }

    try {
      return await this.checkRedis(key, limit, windowSeconds, now);
    } catch (error) {
      console.error('Redis check error, falling back to memory:', error);
      this.useMock = true;
      return this.checkMemory(key, limit, windowSeconds, now);
    }
  }

  async increment(identifier: string, windowSeconds: number = 60): Promise<void> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();

    if (this.useMock || !this.redis) {
      await this.incrementMemory(key, windowSeconds, now);
      return;
    }

    try {
      await this.incrementRedis(key, windowSeconds);
    } catch (error) {
      console.error('Redis increment error, falling back to memory:', error);
      this.useMock = true;
      await this.incrementMemory(key, windowSeconds, now);
    }
  }

  async reset(identifier: string): Promise<void> {
    const key = `rate_limit:${identifier}`;

    if (this.useMock || !this.redis) {
      this.memoryStore.delete(key);
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis reset error:', error);
      this.memoryStore.delete(key);
    }
  }

  /**
   * Redis implementation (distributed)
   */
  private async checkRedis(
    key: string,
    limit: number,
    windowSeconds: number,
    now: number,
  ): Promise<RateLimitResult> {
    if (!this.redis) throw new Error('Redis not available');

    const count = await this.redis.get(key);
    const currentCount = count ? parseInt(count, 10) : 0;

    if (currentCount >= limit) {
      const ttl = await this.redis.ttl(key);
      const resetAt = new Date(now + ttl * 1000);

      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
        retryAfter: ttl > 0 ? ttl : windowSeconds,
      };
    }

    const ttl = await this.redis.ttl(key);
    const resetAt = new Date(now + (ttl > 0 ? ttl * 1000 : windowSeconds * 1000));

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - currentCount),
      resetAt,
    };
  }

  private async incrementRedis(key: string, windowSeconds: number): Promise<void> {
    if (!this.redis) throw new Error('Redis not available');

    const count = await this.redis.get(key);

    if (!count) {
      // First request - set key with expiration
      await this.redis.setex(key, windowSeconds, '1');
    } else {
      // Increment existing key
      await this.redis.incr(key);

      // Ensure TTL is set
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        await this.redis.expire(key, windowSeconds);
      }
    }
  }

  /**
   * In-memory implementation (fallback)
   */
  private checkMemory(
    key: string,
    limit: number,
    windowSeconds: number,
    now: number,
  ): RateLimitResult {
    // Cleanup expired entries
    this.cleanupExpired(now);

    const entry = this.memoryStore.get(key);

    if (!entry || entry.expiresAt < now) {
      // No entry or expired
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetAt: new Date(now + windowSeconds * 1000),
      };
    }

    if (entry.count >= limit) {
      const retryAfter = Math.ceil((entry.expiresAt - now) / 1000);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: new Date(entry.expiresAt),
        retryAfter,
      };
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - entry.count),
      resetAt: new Date(entry.expiresAt),
    };
  }

  private incrementMemory(key: string, windowSeconds: number, now: number): Promise<void> {
    const entry = this.memoryStore.get(key);

    if (!entry || entry.expiresAt < now) {
      // Create new entry
      this.memoryStore.set(key, {
        count: 1,
        expiresAt: now + windowSeconds * 1000,
      });
    } else {
      // Increment existing entry
      entry.count++;
    }

    return Promise.resolve();
  }

  /**
   * Cleanup expired memory entries
   */
  private cleanupExpired(now: number): void {
    for (const [key, entry] of this.memoryStore.entries()) {
      if (entry.expiresAt < now) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Check if using Redis or memory
   */
  isUsingRedis(): boolean {
    return !this.useMock && this.redis?.status === 'ready';
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.memoryStore.clear();
  }
}
