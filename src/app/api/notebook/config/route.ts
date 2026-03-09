import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

// GET /api/notebook/config?brandId=xxx — 获取 NotebookConfig
export const GET = apiHandler(async (req, { session }) => {
  const brandId = req.nextUrl.searchParams.get("brandId");
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  // Verify membership
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此品牌");
  }

  const config = await prisma.notebookConfig.findUnique({
    where: { brandId },
  });

  return NextResponse.json(config);
});

// PATCH /api/notebook/config — 更新 NotebookConfig（包括 isActive）
export const PATCH = apiHandler(async (req, { session }) => {
  const { brandId, isActive } = await req.json();
  
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  // Verify membership
  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
    include: { brand: true },
  });
  if (!member || !["OWNER", "ADMIN", "EDITOR"].includes(member.role)) {
    throw new AppError("FORBIDDEN", "无权修改此配置");
  }

  const updated = await prisma.notebookConfig.update({
    where: { brandId },
    data: { isActive },
  });

  return NextResponse.json(updated);
});