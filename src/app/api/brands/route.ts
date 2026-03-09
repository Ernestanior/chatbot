import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
});

export const GET = apiHandler(async (_req, { session }) => {
  const brands = await prisma.brand.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(brands);
});

export const POST = apiHandler(async (req, { session }) => {
  const body = await req.json();
  const parsed = createBrandSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError("VALIDATION_ERROR", "参数验证失败", { details: parsed.error.flatten() });
  }

  const brand = await prisma.brand.create({
    data: {
      name: parsed.data.name,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
      notebookConfig: {
        create: {},
      },
      replySettings: {
        create: {},
      },
      notebookSections: {
        createMany: {
          data: [
            { sectionType: "BRAND_INFO", title: "品牌信息", sortOrder: 0 },
            { sectionType: "PRODUCTS", title: "产品/服务", sortOrder: 1 },
            { sectionType: "FAQ", title: "常见问答", sortOrder: 2 },
            { sectionType: "TONE", title: "语气与人设", sortOrder: 3 },
            { sectionType: "ESCALATION", title: "转接规则", sortOrder: 4 },
            { sectionType: "OFF_TOPIC", title: "离题处理", sortOrder: 5 },
          ],
        },
      },
    },
  });

  return NextResponse.json(brand, { status: 201 });
});
