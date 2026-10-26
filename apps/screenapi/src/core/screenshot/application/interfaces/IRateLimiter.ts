export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class RateLimitExceededError extends Error {
  constructor(
    public readonly limit: number,
    public readonly resetAt: Date,
    public readonly retryAfter: number,
  ) {
    super(`Rate limit exceeded: ${limit} requests per window. Try again in ${retryAfter}s`);
    this.name = 'RateLimitExceededError';
  }
}

export interface IRateLimiter {
  /**
   * Check if a request is allowed under rate limits
   * @param identifier - Unique identifier (e.g., API key)
   * @param limit - Maximum requests allowed in the window
   * @param windowSeconds - Time window in seconds (default: 60)
   */
  check(
    identifier: string,
    limit: number,
    windowSeconds?: number,
  ): Promise<RateLimitResult>;

  /**
   * Increment the counter for an identifier
   */
  increment(identifier: string, windowSeconds?: number): Promise<void>;

  /**
   * Reset the counter for an identifier
   */
  reset(identifier: string): Promise<void>;
}
