/**
 * Health Check API
 * GET /api/health — Returns service status for monitoring
 */

import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export const GET = apiHandler(async () => {
  const checks: Record<string, { status: string; latencyMs?: number }> = {};

  // Database check
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error", latencyMs: Date.now() - dbStart };
  }

  // Redis check
  const redisStart = Date.now();
  if (redis) {
    try {
      await redis.ping();
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
    } catch {
      checks.redis = { status: "error", latencyMs: Date.now() - redisStart };
    }
  } else {
    checks.redis = { status: "unavailable" };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION ?? "dev",
      uptime: process.uptime(),
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}, { public: true });
