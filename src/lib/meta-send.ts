/**
 * Meta Graph API — Send messages (FB Messenger + IG DM) + Comment operations
 * Enhanced with structured errors and rate limit detection
 */

import { AppError } from "@/lib/errors";

const GRAPH_API = "https://graph.facebook.com/v21.0";

// Meta rate limit error codes
const RATE_LIMIT_CODES = new Set([4, 32, 613]);
// Token expired / invalid
const AUTH_ERROR_CODES = new Set([190, 102]);

interface SendResult {
  recipientId: string;
  messageId: string;
}

/**
 * Handle Meta API error responses with structured error classification
 */
async function handleMetaError(res: Response, operation: string): Promise<never> {
  let body: Record<string, unknown> = {};
  try {
    body = await res.json();
  } catch {
    throw new AppError("META_API_ERROR", `${operation}: HTTP ${res.status}`, { isRetryable: res.status >= 500 });
  }

  const metaErr = (body.error ?? body) as { code?: number; error_subcode?: number; message?: string };
  const code = metaErr.code ?? 0;
  const message = metaErr.message ?? `HTTP ${res.status}`;

  // Rate limited — retryable
  if (RATE_LIMIT_CODES.has(code) || res.status === 429) {
    throw new AppError("RATE_LIMITED", `${operation}: ${message}`, {
      isRetryable: true,
      details: { metaCode: code, subcode: metaErr.error_subcode },
    });
  }

  // Auth errors — not retryable (token needs refresh)
  if (AUTH_ERROR_CODES.has(code) || res.status === 401) {
    throw new AppError("META_API_ERROR", `${operation}: Token 无效或已过期`, {
      isRetryable: false,
      details: { metaCode: code, subcode: metaErr.error_subcode },
    });
  }

  // Server errors — retryable
  if (res.status >= 500) {
    throw new AppError("META_API_ERROR", `${operation}: ${message}`, {
      isRetryable: true,
      details: { metaCode: code },
    });
  }

  // Client errors — not retryable
  throw new AppError("META_API_ERROR", `${operation}: ${message}`, {
    isRetryable: false,
    details: { metaCode: code, subcode: metaErr.error_subcode, body },
  });
}

/**
 * Send a text message via Facebook Messenger
 */
export async function sendFBMessage(
  pageId: string,
  recipientId: string,
  text: string,
  pageToken: string
): Promise<SendResult> {
  const res = await fetch(`${GRAPH_API}/${pageId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text },
    }),
  });

  if (!res.ok) await handleMetaError(res, "FB send");

  const data = await res.json();
  return { recipientId: data.recipient_id, messageId: data.message_id };
}

/**
 * Send a text message via Instagram DM
 */
export async function sendIGMessage(
  igAccountId: string,
  recipientId: string,
  text: string,
  pageToken: string
): Promise<SendResult> {
  const res = await fetch(`${GRAPH_API}/${igAccountId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!res.ok) await handleMetaError(res, "IG send");

  const data = await res.json();
  return { recipientId: data.recipient_id, messageId: data.message_id };
}

/**
 * Send typing indicator (seen + typing_on)
 */
export async function sendTypingIndicator(
  pageId: string,
  recipientId: string,
  pageToken: string
): Promise<void> {
  const actions = ["mark_seen", "typing_on"];
  for (const action of actions) {
    try {
      await fetch(`${GRAPH_API}/${pageId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pageToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: action,
        }),
      });
    } catch {
      // Typing indicators are non-critical, silently ignore
    }
  }
}

/**
 * Reply to a comment on Facebook or Instagram
 */
export async function replyToComment(
  commentId: string,
  text: string,
  pageToken: string
): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_API}/${commentId}/replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: text }),
  });

  if (!res.ok) await handleMetaError(res, "Comment reply");

  return res.json();
}

/**
 * Send a private reply (DM) to a commenter via Instagram or Facebook.
 */
export async function sendPrivateReply(
  commentId: string,
  text: string,
  pageToken: string
): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_API}/${commentId}/private_replies`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pageToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: text }),
  });

  if (!res.ok) await handleMetaError(res, "Private reply");

  return res.json();
}
