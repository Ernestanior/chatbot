/**
 * Redis-based sliding window rate limiter for API routes
 * Compatible with @upstash/redis (HTTP-based)
 */

import { redis } from "@/lib/redis";

export interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window size in seconds */
  windowSecs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp (seconds)
}

const DEFAULT_CONFIG: RateLimitConfig = { max: 60, windowSecs: 60 };

/**
 * Check rate limit for a given key (e.g., userId or IP).
 * Uses Redis INCR + EXPIRE for a simple fixed-window counter.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  // If Redis is unavailable, allow the request (fail open)
  if (!redis) {
    return { allowed: true, remaining: config.max, resetAt: 0 };
  }

  const redisKey = `rl:${key}`;

  try {
    const count = await redis.incr(redisKey);

    // Set expiry only on first request in window
    if (count === 1) {
      await redis.expire(redisKey, config.windowSecs);
    }

    const ttl = await redis.ttl(redisKey);
    const resetAt = Math.floor(Date.now() / 1000) + Math.max(ttl, 0);

    return {
      allowed: count <= config.max,
      remaining: Math.max(config.max - count, 0),
      resetAt,
    };
  } catch {
    // If Redis is down, allow the request (fail open)
    return { allowed: true, remaining: config.max, resetAt: 0 };
  }
}

/** Pre-defined rate limit tiers */
export const RATE_LIMITS = {
  /** Standard API: 60 req/min */
  standard: { max: 60, windowSecs: 60 } satisfies RateLimitConfig,
  /** Webhook: 200 req/min (high throughput) */
  webhook: { max: 200, windowSecs: 60 } satisfies RateLimitConfig,
  /** AI operations: 20 req/min */
  ai: { max: 20, windowSecs: 60 } satisfies RateLimitConfig,
} as const;
