import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

// GET /api/settings/reply?brandId=xxx
export const GET = apiHandler(async (req, { session }) => {
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此品牌");
  }

  // Upsert default settings
  const settings = await prisma.replySettings.upsert({
    where: { brandId },
    create: { brandId },
    update: {},
  });

  return NextResponse.json(settings);
});

// PATCH /api/settings/reply
export const PATCH = apiHandler(async (req, { session }) => {
  const body = await req.json();
  const { brandId, ...data } = body;

  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member || !["OWNER", "ADMIN"].includes(member.role)) {
    throw new AppError("FORBIDDEN", "无权修改此设置");
  }

  const settings = await prisma.replySettings.upsert({
    where: { brandId },
    create: { brandId, ...data },
    update: data,
  });

  return NextResponse.json(settings);
});
