/**
 * Single Conversation API
 * GET  /api/conversations/[id] — Get conversation with messages
 * PATCH /api/conversations/[id] — Update status (takeover / close / reactivate)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = apiHandler(async (_req, { session, params }) => {
  const { id } = params!;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      platformAccount: { select: { platform: true, platformName: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
      },
    },
  });

  if (!conversation) {
    throw new AppError("NOT_FOUND", "会话不存在");
  }

  // Verify access
  const member = await prisma.brandMember.findUnique({
    where: {
      userId_brandId: { userId: session.user.id, brandId: conversation.brandId },
    },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此会话");
  }

  // Reset unread count
  if (conversation.unreadCount > 0) {
    await prisma.conversation.update({
      where: { id },
      data: { unreadCount: 0 },
    });
  }

  // Get customer profile
  const customer = await prisma.customerProfile.findUnique({
    where: {
      brandId_contactPlatformId: {
        brandId: conversation.brandId,
        contactPlatformId: conversation.contactPlatformId,
      },
    },
  });

  return NextResponse.json({ conversation, customer });
});

export const PATCH = apiHandler(async (req, { session, params }) => {
  const { id } = params!;
  const body = await req.json();
  const { status } = body as { status: "AI_ACTIVE" | "HUMAN_TAKEOVER" | "CLOSED" };

  if (!["AI_ACTIVE", "HUMAN_TAKEOVER", "CLOSED"].includes(status)) {
    throw new AppError("VALIDATION_ERROR", "无效的状态值");
  }

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

  const updated = await prisma.conversation.update({
    where: { id },
    data: {
      status,
      humanTakeoverBy: status === "HUMAN_TAKEOVER" ? session.user.id : null,
    },
  });

  return NextResponse.json(updated);
});
