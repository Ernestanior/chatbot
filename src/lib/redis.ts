/**
 * Upstash Redis client — HTTP-based, works in Vercel serverless (no persistent TCP connection)
 */

import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[Redis] UPSTASH_REDIS_REST_URL/TOKEN not set");
    return null;
  }

  return new Redis({ url, token });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production" && redis) globalForRedis.redis = redis;
