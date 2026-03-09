/**
 * Upstash Redis client — HTTP-based, works in Vercel serverless (no persistent TCP connection)
 */

import { Redis } from "@upstash/redis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[Redis] UPSTASH_REDIS_REST_URL/TOKEN not set");
    return new Redis({ url: "http://localhost:8079", token: "local" });
  }

  return new Redis({ url, token });
}

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
