/**
 * Core message processing logic — extracted from incoming-message worker.
 * Can be called directly from webhook route (Vercel serverless) without BullMQ.
 */

import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { chatWithFallback } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/prompt-builder";
import { sendTypingIndicator, sendFBMessage, sendIGMessage } from "@/lib/meta-send";
import { redis } from "@/lib/redis";
import { getApiKeyForProvider } from "@/lib/ai/provider-keys";

export interface IncomingMessageData {
  platformAccountId: string;
  senderId: string;
  senderName?: string;
  messageId: string;
  messageText: string;
  messageType: "text" | "image" | "audio" | "sticker";
  mediaUrl?: string;
  timestamp: number;
  platform: "FACEBOOK" | "INSTAGRAM";
  threadId: string;
}

export async function processIncomingMessage(data: IncomingMessageData) {
  const {
    platformAccountId, senderId, messageId, messageText,
    messageType, timestamp, platform, threadId,
  } = data;

  // 1. Load platform account + brand config
  const account = await prisma.platformAccount.findUnique({
    where: { id: platformAccountId },
    include: {
      brand: {
        include: {
          replySettings: true,
          notebookConfig: true,
          notebookSections: true,
        },
      },
    },
  });

  if (!account || !account.isActive) return;
  const brand = account.brand;
  const settings = brand.replySettings;
  const config = brand.notebookConfig;

  // 2. Upsert conversation (always save, even if AI is disabled)
  const conversation = await prisma.conversation.upsert({
    where: {
      platformAccountId_platformThreadId: {
        platformAccountId: account.id,
        platformThreadId: threadId,
      },
    },
    update: {
      lastMessageAt: new Date(timestamp),
      lastMessagePreview: messageText.slice(0, 300),
      unreadCount: { increment: 1 },
      contactName: data.senderName ?? undefined,
    },
    create: {
      brandId: brand.id,
      platformAccountId: account.id,
      platformThreadId: threadId,
      contactPlatformId: senderId,
      contactName: data.senderName,
      lastMessageAt: new Date(timestamp),
      lastMessagePreview: messageText.slice(0, 300),
    },
  });

  // 3. Save incoming message
  await prisma.message.upsert({
    where: { platformMessageId: messageId },
    update: {},
    create: {
      conversationId: conversation.id,
      platformMessageId: messageId,
      senderType: "CONTACT",
      messageType: messageType.toUpperCase() as "TEXT" | "IMAGE" | "AUDIO" | "STICKER",
      content: messageText,
      metadata: data.mediaUrl ? { mediaUrl: data.mediaUrl } : undefined,
    },
  });

  // 4. Check if AI is enabled and should reply
  if (!config?.isActive) return; // AI disabled — message saved, skip reply
  if (conversation.status === "HUMAN_TAKEOVER" || conversation.status === "CLOSED") return;
  if (!shouldReply(settings)) return;

  // 5. Check frequency limit
  if (settings && await isRateLimited(conversation.id, settings)) return;

  // 6. Check rest time
  if (settings && isRestTime(settings)) return;

  // 7. Load conversation history for context
  const contextSize = settings?.contextWindowSize ?? 20;
  const history = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: contextSize,
  });
  history.reverse();

  // 8. Load customer profile for context
  const profile = await prisma.customerProfile.findUnique({
    where: { brandId_contactPlatformId: { brandId: brand.id, contactPlatformId: senderId } },
  });

  const customerContext = profile
    ? `客户名称: ${profile.name ?? "未知"}\n互动次数: ${profile.totalInteractions}\n标签: ${profile.tags.join(", ") || "无"}`
    : undefined;

  // 9. Build prompt + call AI
  const systemPrompt = buildSystemPrompt(brand.notebookSections, customerContext);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({
      role: (m.senderType === "CONTACT" ? "user" : "assistant") as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Send typing indicator
  const token = decrypt(account.accessToken);
  if (settings?.simulateTypingDelay) {
    await sendTypingIndicator(account.platformUserId, senderId, token);
  }

  const primaryProvider = config.aiProvider;
  const backupProvider = config.fallbackProvider;

  const aiResponse = await chatWithFallback(messages, {
    primary: {
      provider: primaryProvider,
      config: {
        apiKey: getApiKeyForProvider(primaryProvider),
        maxTokens: 500,
        temperature: 0.7,
      },
    },
    backup: backupProvider ? {
      provider: backupProvider,
      config: {
        apiKey: getApiKeyForProvider(backupProvider),
        maxTokens: 500,
        temperature: 0.7,
      },
    } : undefined,
    fallbackMessage: config.fallbackMessage,
    maxRetries: config.maxRetries,
    timeoutMs: config.timeoutMs,
  });

  // 10. Simulate typing delay
  if (settings?.simulateTypingDelay) {
    const delayMs = Math.min(aiResponse.content.length * 30, 3000);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  // 11. Save AI reply message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderType: "AI",
      messageType: "TEXT",
      content: aiResponse.content,
      metadata: { provider: aiResponse.provider, latencyMs: aiResponse.latencyMs },
    },
  });

  // Update conversation preview
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: new Date(),
      lastMessagePreview: aiResponse.content.slice(0, 300),
    },
  });

  // 12. Send reply directly via Meta API (no queue)
  try {
    if (platform === "FACEBOOK") {
      await sendFBMessage(account.platformUserId, senderId, aiResponse.content, token);
    } else {
      await sendIGMessage(account.platformUserId, senderId, aiResponse.content, token);
    }
  } catch (err) {
    console.error(`[ProcessMessage] Send failed for conversation ${conversation.id}:`, err);
    // Message is saved in DB — can be retried manually
  }

  // 13. Update customer profile
  await prisma.customerProfile.upsert({
    where: { brandId_contactPlatformId: { brandId: brand.id, contactPlatformId: senderId } },
    update: {
      totalInteractions: { increment: 1 },
      lastSeenAt: new Date(),
      name: data.senderName ?? undefined,
    },
    create: {
      brandId: brand.id,
      platformAccountId: account.id,
      contactPlatformId: senderId,
      name: data.senderName,
      totalInteractions: 1,
    },
  });

  // 14. Track rate limit
  if (settings?.dmFrequencyLimit) {
    const key = `ratelimit:${conversation.id}`;
    const windowSecs = (settings.dmFrequencyWindowMins ?? 60) * 60;
    await redis.incr(key);
    await redis.expire(key, windowSecs);
  }
}

// ─── Async background tasks (fire-and-forget via waitUntil) ───

export async function runQualityCheck(conversationId: string, brandId: string, aiReply: string, userMessage: string) {
  try {
    // Quick check: if it's a fallback message, flag immediately
    const config = await prisma.notebookConfig.findUnique({ where: { brandId } });
    if (config && aiReply === config.fallbackMessage) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { qualityFlags: { push: "fallback_used" } },
      });
      return;
    }

    const QUALITY_PROMPT = `你是一个 AI 客服质量检测器。分析以下对话，判断 AI 回覆的质量。

用户讯息：
${userMessage}

AI 回覆：
${aiReply}

请用 JSON 格式回覆：
{"quality":"good|mediocre|bad","flags":[],"isUncovered":false,"uncoveredTopic":"","reason":""}
只回覆 JSON。`;

    const response = await chatWithFallback(
      [{ role: "user", content: QUALITY_PROMPT }],
      {
        primary: {
          provider: "OPENAI",
          config: { apiKey: getApiKeyForProvider("OPENAI"), model: "gpt-4o-mini", maxTokens: 300, temperature: 0 },
        },
        fallbackMessage: '{"quality":"good","flags":[],"isUncovered":false,"reason":"skip"}',
        maxRetries: 1,
        timeoutMs: 15000,
      }
    );

    const jsonMatch = response.content.trim().match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const evaluation = JSON.parse(jsonMatch[0]) as {
      quality: string; flags: string[]; isUncovered: boolean; uncoveredTopic?: string;
    };

    if (evaluation.quality !== "good" && evaluation.flags.length > 0) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { qualityFlags: { push: evaluation.flags } },
      });
    }

    if (evaluation.isUncovered && evaluation.uncoveredTopic) {
      await upsertUncoveredTopic(brandId, evaluation.uncoveredTopic, userMessage);
    }
  } catch (err) {
    console.error("[QualityCheck] Failed:", err);
  }
}

export async function runSummarize(conversationId: string) {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    if (messages.length < 5) return;

    const conversationText = messages
      .map((m) => {
        const role = m.senderType === "CONTACT" ? "客户" : m.senderType === "AI" ? "AI" : "真人客服";
        return `${role}: ${m.content}`;
      })
      .join("\n");

    const response = await chatWithFallback(
      [{ role: "user", content: `请将以下客服对话摘要为 2-3 句话（不超过 200 字）：\n\n${conversationText}` }],
      {
        primary: {
          provider: "OPENAI",
          config: { apiKey: getApiKeyForProvider("OPENAI"), model: "gpt-4o-mini", maxTokens: 300, temperature: 0.3 },
        },
        fallbackMessage: "",
        maxRetries: 1,
        timeoutMs: 15000,
      }
    );

    if (response.content) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { summary: response.content },
      });
    }
  } catch (err) {
    console.error("[Summarize] Failed:", err);
  }
}

// ─── Helpers ───

/** Check if auto-reply is enabled in settings */
function shouldReply(settings: { replyProbability?: number } | null): boolean {
  if (!settings) return false;
  // replyProbability is 0-100, if 0 means disabled
  const prob = settings.replyProbability ?? 100;
  if (prob <= 0) return false;
  if (prob >= 100) return true;
  return Math.random() * 100 < prob;
}

/** Check if current time falls within rest hours (no replies during rest) */
function isRestTime(settings: { restTimeStart?: string | null; restTimeEnd?: string | null; restTimeTimezone?: string } | null): boolean {
  if (!settings?.restTimeStart || !settings?.restTimeEnd) return false;
  // Parse "HH:mm" strings to hours
  const startHour = parseInt(settings.restTimeStart.split(":")[0], 10);
  const endHour = parseInt(settings.restTimeEnd.split(":")[0], 10);
  if (isNaN(startHour) || isNaN(endHour)) return false;

  // Get current hour in the configured timezone
  const tz = settings.restTimeTimezone || "Asia/Taipei";
  const hour = new Date().toLocaleString("en-US", { timeZone: tz, hour: "numeric", hour12: false });
  const currentHour = parseInt(hour, 10);

  // Handle overnight ranges (e.g. 22:00 - 08:00)
  if (startHour > endHour) {
    return currentHour >= startHour || currentHour < endHour;
  }
  return currentHour >= startHour && currentHour < endHour;
}

async function isRateLimited(
  conversationId: string,
  settings: { dmFrequencyLimit: number | null; dmFrequencyWindowMins: number | null }
): Promise<boolean> {
  if (!settings.dmFrequencyLimit) return false;
  const key = `ratelimit:${conversationId}`;
  const count = await redis.get<string>(key);
  return count !== null && parseInt(count) >= settings.dmFrequencyLimit;
}

async function upsertUncoveredTopic(brandId: string, topic: string, sampleMessage: string) {
  const existing = await prisma.uncoveredTopic.findFirst({
    where: { brandId, topic, status: "PENDING" },
  });

  if (existing) {
    const samples = (existing.sampleMessages as string[]) ?? [];
    if (samples.length < 10) samples.push(sampleMessage);
    await prisma.uncoveredTopic.update({
      where: { id: existing.id },
      data: { count: { increment: 1 }, sampleMessages: samples },
    });
  } else {
    await prisma.uncoveredTopic.create({
      data: { brandId, topic, sampleMessages: [sampleMessage], count: 1 },
    });
  }
}
