import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { getProvider } from "@/lib/ai";
import { getApiKeyForProvider } from "@/lib/ai/provider-keys";
import type { AIMessage } from "@/lib/ai/types";

export const maxDuration = 60;

// POST /api/notebook/lint — AI reviews notebook sections for quality
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

  const config = await prisma.notebookConfig.findUnique({
    where: { brandId },
  });

  const sectionSummary = sections.map((s) => ({
    type: s.sectionType,
    title: s.title,
    active: s.isActive,
    hasContent: s.plainText.trim().length > 0,
    contentLength: s.plainText.length,
  }));

  const messages: AIMessage[] = [
    {
      role: "system",
      content: `你是一个 AI 客服笔记本质量审查专家。请检查以下笔记本配置，找出潜在问题并给出改善建议。
回覆格式为 JSON 数组，每个元素包含：
- "section": 模块名称
- "severity": "error" | "warning" | "info"
- "message": 具体问题描述
- "suggestion": 改善建议

常见检查项：
1. 必要模块（品牌信息、FAQ、语气）是否有内容
2. 转接规则是否明确
3. 离题处理是否设定
4. 内容是否有矛盾或模糊之处
5. 语气设定是否具体可执行`,
    },
    {
      role: "user",
      content: `笔记本模块概览：\n${JSON.stringify(sectionSummary, null, 2)}\n\n各模块内容：\n${sections.map((s) => `### ${s.title} (${s.sectionType})\n${s.plainText || "(空)"}`).join("\n\n")}`,
    },
  ];

  const providerName = config?.aiProvider ?? "OPENAI";
  const apiKey = getApiKeyForProvider(providerName);

  try {
    const provider = getProvider(providerName);
    const result = await provider.chat(messages, {
      apiKey,
      temperature: 0.3,
      maxTokens: 1500,
    });

    let issues;
    try {
      // Try to parse JSON from the response
      const jsonMatch = result.content.match(/\[[\s\S]*\]/);
      issues = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      issues = [{ section: "general", severity: "info", message: result.content, suggestion: "" }];
    }

    return NextResponse.json({ issues, tokensUsed: result.tokensUsed });
  } catch (err) {
    console.error("[Lint] AI call failed:", err);
    throw new AppError("AI_PROVIDER_ERROR", "AI lint failed");
  }
});