import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

// PATCH /api/comment-triggers/[id]
export const PATCH = apiHandler(async (req, { session, params }) => {
  const { id } = params!;
  const body = await req.json();

  const trigger = await prisma.commentTrigger.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.triggerType !== undefined && { triggerType: body.triggerType }),
      ...(body.postId !== undefined && { postId: body.postId || null }),
      ...(body.hashtag !== undefined && { hashtag: body.hashtag || null }),
      ...(body.keywords !== undefined && { keywords: body.keywords }),
      ...(body.dmContent !== undefined && { dmContent: body.dmContent || null }),
      ...(body.commentReply !== undefined && { commentReply: body.commentReply || null }),
      ...(body.useAI !== undefined && { useAI: body.useAI }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return NextResponse.json(trigger);
});

// DELETE /api/comment-triggers/[id]
export const DELETE = apiHandler(async (_req, { session, params }) => {
  const { id } = params!;
  await prisma.commentTrigger.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
