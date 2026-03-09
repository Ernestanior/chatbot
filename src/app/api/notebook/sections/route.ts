import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const updateSectionSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  plainText: z.string().optional(),
  content: z.any().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// GET /api/notebook/sections?brandId=xxx
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

  const sections = await prisma.notebookSection.findMany({
    where: { brandId },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(sections);
});

// PATCH /api/notebook/sections — update a section
export const PATCH = apiHandler(async (req, { session }) => {
  const body = await req.json();
  const { sectionId, ...data } = body;

  if (!sectionId) {
    throw new AppError("VALIDATION_ERROR", "sectionId required");
  }

  const parsed = updateSectionSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "参数验证失败", { details: parsed.error.flatten() });
  }

  // Verify ownership
  const section = await prisma.notebookSection.findUnique({
    where: { id: sectionId },
    include: { brand: { include: { members: true } } },
  });
  if (!section) {
    throw new AppError("NOT_FOUND", "模块不存在");
  }
  const isMember = section.brand.members.some(
    (m) => m.userId === session.user.id && ["OWNER", "ADMIN", "EDITOR"].includes(m.role)
  );
  if (!isMember) {
    throw new AppError("FORBIDDEN", "无权编辑此模块");
  }

  const updated = await prisma.notebookSection.update({
    where: { id: sectionId },
    data: parsed.data,
  });

  return NextResponse.json(updated);
});