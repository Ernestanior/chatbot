import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

// POST /api/notebook/toggle — toggle section active/inactive
export const POST = apiHandler(async (req, { session }) => {
  const { sectionId } = await req.json();
  if (!sectionId) {
    throw new AppError("VALIDATION_ERROR", "sectionId required");
  }

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
    throw new AppError("FORBIDDEN", "无权操作此模块");
  }

  const updated = await prisma.notebookSection.update({
    where: { id: sectionId },
    data: { isActive: !section.isActive },
  });

  return NextResponse.json(updated);
});
