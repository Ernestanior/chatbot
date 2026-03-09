import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";
import { chatWithFallback } from "@/lib/ai";
import { getApiKeyForProvider } from "@/lib/ai/provider-keys";
import { buildSystemPrompt } from "@/lib/ai/prompt-builder";
import type { AIMessage } from "@/lib/ai/types";

export const maxDuration = 60;

// POST /api/test/simulate — test a message against current notebook
export const POST = apiHandler(async (req, { session }) => {
  const { brandId, message, conversationHistory } = await req.json();
  if (!brandId || !message) {
    throw new AppError("VALIDATION_ERROR", "brandId and message required");
  }

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此品牌");
  }

  const [sections, config] = await Promise.all([
    prisma.notebookSection.findMany({
      where: { brandId },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.notebookConfig.findUnique({ where: { brandId } }),
  ]);

  const systemPrompt = buildSystemPrompt(sections);
  const messages: AIMessage[] = [{ role: "system", content: systemPrompt }];

  // Append conversation history if provided
  if (Array.isArray(conversationHistory)) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: message });

  const primaryProvider = config?.aiProvider ?? "OPENAI";
  const primaryKey = getApiKeyForProvider(primaryProvider);

  const backupProvider = config?.fallbackProvider;
  const backupKey = backupProvider
    ? getApiKeyForProvider(backupProvider)
    : undefined;

  const result = await chatWithFallback(messages, {
    primary: { provider: primaryProvider, config: { apiKey: primaryKey } },
    backup: backupProvider && backupKey
      ? { provider: backupProvider, config: { apiKey: backupKey } }
      : undefined,
    fallbackMessage: config?.fallbackMessage ?? "感谢您的讯息，我们会尽快回覆您。",
    maxRetries: config?.maxRetries ?? 2,
    timeoutMs: config?.timeoutMs ?? 30000,
  });

  return NextResponse.json({
    reply: result.content,
    provider: result.provider,
    tokensUsed: result.tokensUsed,
    latencyMs: result.latencyMs,
  });
});