/**
 * Messages API
 * GET  /api/conversations/[id]/messages?cursor=xxx&limit=50
 * POST /api/conversations/[id]/messages — Send human message
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { decrypt } from "@/lib/encryption";
import { sendFBMessage, sendIGMessage } from "@/lib/meta-send";

export const GET = apiHandler(async (req, { session, params }) => {
  const { id } = params!;
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    throw new AppError("NOT_FOUND", "会话不存在");
  }

  const member = await prisma.brandMember.findUnique({
    where: {
      userId_brandId: { userId: session.user.id, brandId: conversation.brandId },
    },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此会话");
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  return NextResponse.json({
    messages: messages.reverse(), // Return in chronological order
    hasMore,
    nextCursor: hasMore ? messages[0]?.id : null,
  });
});

export const POST = apiHandler(async (req, { session, params }) => {
  const { id } = params!;
  const body = await req.json();
  const { content } = body as { content: string };

  if (!content?.trim()) {
    throw new AppError("VALIDATION_ERROR", "content required");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { platformAccount: true },
  });
  if (!conversation) {
    throw new AppError("NOT_FOUND", "会话不存在");
  }

  const member = await prisma.brandMember.findUnique({
    where: {
      userId_brandId: { userId: session.user.id, brandId: conversation.brandId },
    },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此会话");
  }

  // Only allow sending if human has taken over or conversation is AI active
  if (conversation.status === "CLOSED") {
    throw new AppError("VALIDATION_ERROR", "Conversation is closed");
  }

  // Auto-takeover if sending as human while AI is active
  if (conversation.status === "AI_ACTIVE") {
    await prisma.conversation.update({
      where: { id },
      data: { status: "HUMAN_TAKEOVER", humanTakeoverBy: session.user.id },
    });
  }

  // Save message to DB
  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderType: "HUMAN",
      content: content.trim(),
    },
  });

  // Update conversation preview
  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: content.trim().slice(0, 300),
    },
  });

  // Send via Meta API directly (no queue)
  const token = decrypt(conversation.platformAccount.accessToken);
  const platform = conversation.platformAccount.platform;
  const accountPlatformId = conversation.platformAccount.platformUserId;

  try {
    if (platform === "FACEBOOK") {
      await sendFBMessage(accountPlatformId, conversation.contactPlatformId, content.trim(), token);
    } else {
      await sendIGMessage(accountPlatformId, conversation.contactPlatformId, content.trim(), token);
    }
  } catch (err) {
    console.error("[Messages] Send failed:", err);
    throw new AppError("META_API_ERROR", "发送消息失败，请稍后重试");
  }

  return NextResponse.json(message, { status: 201 });
});
