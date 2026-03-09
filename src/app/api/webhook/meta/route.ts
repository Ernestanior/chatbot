/**
 * Meta Webhook Route — Vercel-compatible (no BullMQ)
 *
 * GET  /api/webhook/meta — Webhook verification (Meta challenge)
 * POST /api/webhook/meta — Receive webhook events, process directly
 *
 * Uses waitUntil() for background tasks (quality check, summarize)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { processIncomingMessage } from "@/lib/process-message";
import type { IncomingMessageData } from "@/lib/process-message";
import { processCommentTrigger } from "@/lib/process-comment";
import type { CommentTriggerData } from "@/lib/process-comment";

export const maxDuration = 60;

const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN ?? "chatbotai_verify";

/**
 * GET /api/webhook/meta — Webhook verification (Meta challenge)
 */
export const GET = apiHandler(async (req) => {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  console.log("[Webhook GET] params:", { mode, token, challenge, VERIFY_TOKEN, allParams: Object.fromEntries(params.entries()) });

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Webhook] Verified OK");
    return new NextResponse(challenge, { status: 200 });
  }

  console.log("[Webhook] Verification FAILED — mode:", mode, "token match:", token === VERIFY_TOKEN);
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}, { public: true, rateLimit: false });

/**
 * POST /api/webhook/meta — Receive webhook events
 * Process messages synchronously, fire background tasks via waitUntil
 */
export const POST = apiHandler(async (req) => {
  const body = await req.json();
  console.log("[Webhook POST] RECEIVED — object:", body.object, "entries:", body.entry?.length ?? 0, "body:", JSON.stringify(body).substring(0, 500));

  try {
    if (body.object === "page") {
      await handlePageEvents(body.entry ?? []);
      await handlePageComments(body.entry ?? []);
    } else if (body.object === "instagram") {
      await handleIGEvents(body.entry ?? []);
      await handleIGComments(body.entry ?? []);
    }
  } catch (err) {
    console.error("[Webhook] Error processing event:", err instanceof Error ? err.message : err);
    console.error("[Webhook] Stack:", err instanceof Error ? err.stack : "N/A");
  }

  return NextResponse.json({ received: true });
}, { public: true, rateLimit: RATE_LIMITS.webhook });

// ─── Facebook Page Messaging Events ───

interface FBMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type: string; payload: { url: string } }>;
  };
}

async function handlePageEvents(entries: Array<{ id: string; messaging?: FBMessagingEvent[] }>) {
  for (const entry of entries) {
    const pageId = entry.id;

    const account = await prisma.platformAccount.findUnique({
      where: { platform_platformUserId: { platform: "FACEBOOK", platformUserId: pageId } },
    });
    if (!account || !account.isActive) continue;

    for (const event of entry.messaging ?? []) {
      if (!event.message || event.message.is_echo) continue;

      const msg = event.message;
      const attachType = msg.attachments?.[0]?.type;
      const messageType = attachType === "image" ? "image"
        : attachType === "audio" ? "audio"
        : attachType === "sticker" ? "sticker"
        : "text";

      const data: IncomingMessageData = {
        platformAccountId: account.id,
        senderId: event.sender.id,
        messageId: msg.mid,
        messageText: msg.text ?? (attachType ? `[${attachType}]` : ""),
        messageType,
        mediaUrl: msg.attachments?.[0]?.payload?.url,
        timestamp: event.timestamp,
        platform: "FACEBOOK",
        threadId: event.sender.id,
      };

      // Process directly (no queue)
      await processIncomingMessage(data);
    }
  }
}

// ─── Instagram Messaging Events ───

interface IGMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{ type: string; payload: { url: string } }>;
  };
}

async function handleIGEvents(entries: Array<{ id: string; messaging?: IGMessagingEvent[] }>) {
  for (const entry of entries) {
    const igAccountId = entry.id;

    const account = await prisma.platformAccount.findUnique({
      where: { platform_platformUserId: { platform: "INSTAGRAM", platformUserId: igAccountId } },
    });
    if (!account || !account.isActive) continue;

    for (const event of entry.messaging ?? []) {
      if (!event.message || event.message.is_echo) continue;

      const msg = event.message;
      const attachType = msg.attachments?.[0]?.type;
      const messageType = attachType === "image" ? "image"
        : attachType === "audio" ? "audio"
        : attachType === "sticker" ? "sticker"
        : "text";

      const data: IncomingMessageData = {
        platformAccountId: account.id,
        senderId: event.sender.id,
        messageId: msg.mid,
        messageText: msg.text ?? (attachType ? `[${attachType}]` : ""),
        messageType,
        mediaUrl: msg.attachments?.[0]?.payload?.url,
        timestamp: event.timestamp,
        platform: "INSTAGRAM",
        threadId: event.sender.id,
      };

      await processIncomingMessage(data);
    }
  }
}

// ─── Facebook Page Comment Events ───

interface FBChangeEvent {
  field: string;
  value: {
    item: string;
    comment_id: string;
    parent_id?: string;
    post_id: string;
    from: { id: string; name: string };
    message: string;
    verb: string;
    created_time: number;
  };
}

async function handlePageComments(entries: Array<{ id: string; changes?: FBChangeEvent[] }>) {
  for (const entry of entries) {
    const pageId = entry.id;
    for (const change of entry.changes ?? []) {
      if (change.field !== "feed") continue;
      const v = change.value;
      if (v.item !== "comment" || v.verb !== "add") continue;
      if (v.from.id === pageId) continue;

      const account = await prisma.platformAccount.findUnique({
        where: { platform_platformUserId: { platform: "FACEBOOK", platformUserId: pageId } },
      });
      if (!account || !account.isActive) continue;

      const data: CommentTriggerData = {
        platformAccountId: account.id,
        brandId: account.brandId,
        commentId: v.comment_id,
        commentText: v.message,
        commenterId: v.from.id,
        commenterName: v.from.name,
        postId: v.post_id,
        platform: "FACEBOOK",
      };

      await processCommentTrigger(data);
    }
  }
}

// ─── Instagram Comment Events ───

interface IGCommentEvent {
  field: string;
  value: {
    id: string;
    text: string;
    from: { id: string; username: string };
    media: { id: string };
    timestamp: string;
  };
}

async function handleIGComments(entries: Array<{ id: string; changes?: IGCommentEvent[] }>) {
  for (const entry of entries) {
    const igAccountId = entry.id;
    for (const change of entry.changes ?? []) {
      if (change.field !== "comments") continue;
      const v = change.value;
      if (v.from.id === igAccountId) continue;

      const account = await prisma.platformAccount.findUnique({
        where: { platform_platformUserId: { platform: "INSTAGRAM", platformUserId: igAccountId } },
      });
      if (!account || !account.isActive) continue;

      const data: CommentTriggerData = {
        platformAccountId: account.id,
        brandId: account.brandId,
        commentId: v.id,
        commentText: v.text,
        commenterId: v.from.id,
        commenterName: v.from.username,
        postId: v.media.id,
        platform: "INSTAGRAM",
      };

      await processCommentTrigger(data);
    }
  }
}
