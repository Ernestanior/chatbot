import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

// POST /api/notebook/versions — create a snapshot of current notebook
export const POST = apiHandler(async (req, { session }) => {
  const { brandId } = await req.json();
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

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

  const version = await prisma.notebookVersion.create({
    data: {
      brandId,
      createdBy: session.user.id,
      snapshot: JSON.parse(JSON.stringify(sections)),
    },
  });

  return NextResponse.json(version, { status: 201 });
});

// GET /api/notebook/versions?brandId=xxx
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

  const versions = await prisma.notebookVersion.findMany({
    where: { brandId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(versions);
});