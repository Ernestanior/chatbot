import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

// GET /api/comment-triggers?brandId=xxx
export const GET = apiHandler(async (req, { session }) => {
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) throw new AppError("VALIDATION_ERROR", "brandId required");

  const triggers = await prisma.commentTrigger.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(triggers);
});

// POST /api/comment-triggers
export const POST = apiHandler(async (req, { session }) => {
  const body = await req.json();
  const { brandId, platformAccountId, name, triggerType, postId, hashtag, keywords, dmContent, commentReply, useAI } = body;

  if (!brandId || !name || !triggerType) {
    throw new AppError("VALIDATION_ERROR", "Missing required fields");
  }

  const trigger = await prisma.commentTrigger.create({
    data: {
      brandId,
      platformAccountId: platformAccountId || null,
      name,
      triggerType,
      postId: postId || null,
      hashtag: hashtag || null,
      keywords: keywords || [],
      dmContent: dmContent || null,
      commentReply: commentReply || null,
      useAI: useAI ?? false,
    },
  });

  return NextResponse.json(trigger, { status: 201 });
});
