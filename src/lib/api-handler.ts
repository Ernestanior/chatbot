/**
 * API route handler wrapper — standardizes auth, error responses, and logging
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { RateLimitConfig } from "@/lib/rate-limit";

interface HandlerContext {
  session: { user: { id: string; email?: string | null } };
  params?: Record<string, string>;
}

type RouteHandler = (req: NextRequest, ctx: HandlerContext) => Promise<NextResponse>;

interface ApiHandlerOptions {
  /** Skip authentication check (e.g., webhooks) */
  public?: boolean;
  /** Rate limit config (defaults to standard: 60 req/min) */
  rateLimit?: RateLimitConfig | false;
}

/**
 * Wraps an API route handler with:
 * - Authentication check (unless public)
 * - Structured error responses
 * - Request timing
 */
export function apiHandler(handler: RouteHandler, opts?: ApiHandlerOptions) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    const start = Date.now();

    try {
      let session: HandlerContext["session"];

      if (opts?.public) {
        session = { user: { id: "anonymous" } };
      } else {
        const s = await auth();
        if (!s?.user?.id) {
          return NextResponse.json(
            { error: { code: "UNAUTHORIZED", message: "请先登录" } },
            { status: 401 }
          );
        }
        session = { user: { id: s.user.id, email: s.user.email } };
      }

      // Rate limiting (skip if explicitly disabled)
      if (opts?.rateLimit !== false) {
        const rlConfig = opts?.rateLimit ?? RATE_LIMITS.standard;
        const rlKey = opts?.public
          ? req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "anon"
          : session.user.id;
        const rl = await checkRateLimit(rlKey, rlConfig);

        if (!rl.allowed) {
          return NextResponse.json(
            { error: { code: "RATE_LIMITED", message: "请求过于频繁，请稍后再试" } },
            {
              status: 429,
              headers: {
                "Retry-After": String(rl.resetAt - Math.floor(Date.now() / 1000)),
                "X-RateLimit-Remaining": "0",
              },
            }
          );
        }
      }

      const params = routeCtx?.params ? await routeCtx.params : undefined;
      const result = await handler(req, { session, params });

      // Add timing header
      result.headers.set("X-Response-Time", `${Date.now() - start}ms`);
      return result;
    } catch (err) {
      const elapsed = Date.now() - start;

      if (err instanceof AppError) {
        console.error(`[API] ${req.method} ${req.nextUrl.pathname} → ${err.code} (${elapsed}ms)`);
        return NextResponse.json(err.toJSON(), { status: err.statusCode });
      }

      // Prisma known errors
      if (isPrismaError(err)) {
        const { status, body } = handlePrismaError(err);
        console.error(`[API] ${req.method} ${req.nextUrl.pathname} → Prisma ${err.code} (${elapsed}ms)`);
        return NextResponse.json(body, { status });
      }

      // Unexpected errors
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : undefined;
      console.error(`[API] ${req.method} ${req.nextUrl.pathname} → 500 (${elapsed}ms)`, errMsg, errStack);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "服务器内部错误", debug: errMsg } },
        { status: 500 }
      );
    }
  };
}

// ─── Prisma Error Handling ───

interface PrismaError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

function isPrismaError(err: unknown): err is PrismaError {
  return err instanceof Error && "code" in err && typeof (err as PrismaError).code === "string" && (err as PrismaError).code.startsWith("P");
}

function handlePrismaError(err: PrismaError): { status: number; body: object } {
  switch (err.code) {
    case "P2002": // Unique constraint violation
      return {
        status: 409,
        body: { error: { code: "CONFLICT", message: "记录已存在", details: err.meta } },
      };
    case "P2025": // Record not found
      return {
        status: 404,
        body: { error: { code: "NOT_FOUND", message: "记录不存在" } },
      };
    case "P2003": // Foreign key constraint
      return {
        status: 400,
        body: { error: { code: "VALIDATION_ERROR", message: "关联记录不存在", details: err.meta } },
      };
    default:
      return {
        status: 500,
        body: { error: { code: "INTERNAL_ERROR", message: "数据库操作失败" } },
      };
  }
}
