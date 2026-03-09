/**
 * Conversations API
 * GET /api/conversations?brandId=xxx&status=AI_ACTIVE&page=1&limit=20
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  // Verify user has access to this brand
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此品牌");
  }

  const status = searchParams.get("status") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const search = searchParams.get("search") || undefined;

  const where: Record<string, unknown> = { brandId };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { contactName: { contains: search, mode: "insensitive" } },
      { lastMessagePreview: { contains: search, mode: "insensitive" } },
    ];
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        platformAccount: { select: { platform: true, platformName: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return NextResponse.json({
    conversations,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});
