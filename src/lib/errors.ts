/**
 * Structured error handling for ChatBotAI
 */

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "EXTERNAL_API_ERROR"
  | "AI_PROVIDER_ERROR"
  | "META_API_ERROR"
  | "INTERNAL_ERROR";

const STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  EXTERNAL_API_ERROR: 502,
  AI_PROVIDER_ERROR: 502,
  META_API_ERROR: 502,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isRetryable: boolean;

  constructor(code: ErrorCode, message: string, opts?: { details?: unknown; isRetryable?: boolean }) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = STATUS_MAP[code];
    this.details = opts?.details;
    this.isRetryable = opts?.isRetryable ?? false;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

/**
 * Determine if an error is transient (worth retrying)
 */
export function isTransientError(err: unknown): boolean {
  if (err instanceof AppError) return err.isRetryable;

  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // Network / timeout errors
    if (msg.includes("timeout") || msg.includes("econnreset") || msg.includes("econnrefused")) return true;
    // Rate limit from external APIs
    if (msg.includes("rate limit") || msg.includes("429") || msg.includes("too many requests")) return true;
    // Temporary server errors
    if (msg.includes("503") || msg.includes("502")) return true;
  }

  return false;
}

/**
 * Parse Meta API error response for structured handling
 */
export function parseMetaApiError(err: unknown): { code: number; subcode?: number; message: string; retryAfter?: number } {
  try {
    const msg = err instanceof Error ? err.message : String(err);
    const jsonMatch = msg.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { code: 0, message: msg };

    const parsed = JSON.parse(jsonMatch[0]);
    const metaErr = parsed.error ?? parsed;
    return {
      code: metaErr.code ?? 0,
      subcode: metaErr.error_subcode,
      message: metaErr.message ?? msg,
      retryAfter: metaErr.code === 4 || metaErr.code === 32 ? 60 : undefined, // Rate limit codes
    };
  } catch {
    return { code: 0, message: String(err) };
  }
}

/**
 * Structured error logger for background processing
 */
export function logProcessingError(source: string, taskId: string | undefined, err: unknown, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const isRetryable = isTransientError(err);
  const message = err instanceof Error ? err.message : String(err);

  console.error(JSON.stringify({
    level: "error",
    timestamp,
    source,
    taskId: taskId ?? "unknown",
    message,
    isRetryable,
    ...(context ?? {}),
    ...(err instanceof AppError ? { code: err.code } : {}),
  }));
}
