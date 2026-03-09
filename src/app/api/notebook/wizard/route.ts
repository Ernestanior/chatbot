import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { getProvider } from "@/lib/ai";
import { getApiKeyForProvider } from "@/lib/ai/provider-keys";
import type { AIMessage } from "@/lib/ai/types";

export const maxDuration = 60;

// POST /api/notebook/wizard — AI generates notebook content from brand description
export const POST = apiHandler(async (req, { session }) => {
  const { brandId, description } = await req.json();
  if (!brandId || !description) {
    throw new AppError("VALIDATION_ERROR", "brandId and description required");
  }

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member || !["OWNER", "ADMIN", "EDITOR"].includes(member.role)) {
    throw new AppError("FORBIDDEN", "无权操作此品牌笔记本");
  }

  const messages: AIMessage[] = [
    {
      role: "system",
      content: `你是一个 AI 客服笔记本生成专家。根据用户提供的品牌描述，生成完整的客服笔记本内容。
请以 JSON 格式回覆，包含以下字段：
{
  "BRAND_INFO": "品牌信息内容",
  "PRODUCTS": "产品/服务内容",
  "FAQ": "常见问答内容（Q&A 格式）",
  "TONE": "语气与人设描述",
  "ESCALATION": "转接真人的规则",
  "OFF_TOPIC": "离题处理方式"
}
每个字段的内容应该具体、可执行，适合作为 AI 客服的指导规则。`,
    },
    {
      role: "user",
      content: `品牌描述：${description}`,
    },
  ];

  const config = await prisma.notebookConfig.findUnique({ where: { brandId } });
  const providerName = config?.aiProvider ?? "OPENAI";
  const apiKey = getApiKeyForProvider(providerName);

  try {
    const provider = getProvider(providerName);
    const result = await provider.chat(messages, {
      apiKey,
      temperature: 0.5,
      maxTokens: 3000,
    });

    let generated;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      generated = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      throw new AppError("AI_PROVIDER_ERROR", "Failed to parse AI response");
    }

    if (!generated) {
      throw new AppError("AI_PROVIDER_ERROR", "No content generated");
    }

    // Update sections with generated content
    const sections = await prisma.notebookSection.findMany({
      where: { brandId },
    });

    const updates = sections
      .filter((s) => generated[s.sectionType])
      .map((s) => {
        const val = generated[s.sectionType];
        const text = typeof val === "string" ? val : JSON.stringify(val, null, 2);
        return prisma.notebookSection.update({
          where: { id: s.id },
          data: { plainText: text },
        });
      });

    await Promise.all(updates);

    return NextResponse.json({
      generated,
      tokensUsed: result.tokensUsed,
      sectionsUpdated: updates.length,
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Wizard] AI call failed:", msg, "provider:", providerName, "keyPrefix:", apiKey.slice(0, 8));
    throw new AppError("AI_PROVIDER_ERROR", `AI generation failed: ${msg}`);
  }
});