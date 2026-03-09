/**
 * Core comment trigger processing — extracted from comment-trigger worker.
 * Callable directly from webhook route without BullMQ.
 */

import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { chatWithFallback } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/prompt-builder";
import { replyToComment, sendPrivateReply } from "@/lib/meta-send";
import { redis } from "@/lib/redis";
import { getApiKeyForProvider } from "@/lib/ai/provider-keys";

export interface CommentTriggerData {
  platformAccountId: string;
  brandId: string;
  commentId: string;
  commentText: string;
  commenterId: string;
  commenterName?: string;
  postId: string;
  platform: "FACEBOOK" | "INSTAGRAM";
}

export async function processCommentTrigger(data: CommentTriggerData) {
  const { brandId, commentId, commentText, commenterName, postId, platformAccountId } = data;

  // 1. Load active triggers for this brand + account
  const triggers = await prisma.commentTrigger.findMany({
    where: { brandId, platformAccountId, isActive: true },
  });
  if (triggers.length === 0) return;

  // 2. Deduplicate — skip if already processed
  const dedupeKey = `ct:${commentId}`;
  const already = await redis.set(dedupeKey, "1", { ex: 86400, nx: true });
  if (!already) return; // already processed

  // 3. Find matching trigger
  const matched = triggers.find((t) => matchesTrigger(t, commentText, postId));
  if (!matched) return;

  // 4. Load account token
  const account = await prisma.platformAccount.findUnique({
    where: { id: platformAccountId },
    include: {
      brand: {
        include: { notebookConfig: true, notebookSections: true },
      },
    },
  });
  if (!account) return;
  const token = decrypt(account.accessToken);

  // 5. Reply to comment (if configured)
  if (matched.commentReply) {
    try {
      await replyToComment(commentId, matched.commentReply, token);
      console.log(`[CommentTrigger] Replied to comment ${commentId}`);
    } catch (err) {
      console.error(`[CommentTrigger] Comment reply failed:`, err);
    }
  }

  // 6. Send DM (static or AI-generated)
  let dmText = matched.dmContent ?? "";

  if (matched.useAI && account.brand.notebookConfig?.isActive) {
    dmText = await generateAIDM(account.brand, commentText, commenterName);
  }

  if (dmText) {
    try {
      await sendPrivateReply(commentId, dmText, token);
      console.log(`[CommentTrigger] Sent DM to commenter of ${commentId}`);
    } catch (err) {
      console.error(`[CommentTrigger] DM send failed:`, err);
    }
  }
}

// ─── Matching Logic ───

export function matchesTrigger(
  trigger: { triggerType: string; postId: string | null; hashtag: string | null; keywords: string[] },
  commentText: string,
  postId: string
): boolean {
  if (trigger.postId && trigger.postId !== postId) return false;
  const text = commentText.toLowerCase();

  if (trigger.triggerType === "KEYWORD") {
    return trigger.keywords.some((kw) => text.includes(kw.toLowerCase()));
  }
  if (trigger.triggerType === "HASHTAG") {
    if (!trigger.hashtag) return false;
    const tag = trigger.hashtag.toLowerCase().replace(/^#/, "");
    return text.includes(`#${tag}`) || text.includes(tag);
  }
  return false;
}

// ─── AI DM Generation ───

async function generateAIDM(
  brand: {
    notebookConfig: { aiProvider: string; fallbackProvider: string | null; fallbackMessage: string; maxRetries: number; timeoutMs: number } | null;
    notebookSections: Array<{ isActive: boolean; plainText: string; sortOrder: number; sectionType: string; title: string; id: string; brandId: string; content: unknown; createdAt: Date; updatedAt: Date }>;
  },
  commentText: string,
  commenterName?: string
): Promise<string> {
  const config = brand.notebookConfig!;
  const systemPrompt = buildSystemPrompt(
    brand.notebookSections as Parameters<typeof buildSystemPrompt>[0],
    commenterName ? `留言者: ${commenterName}` : undefined
  );

  const result = await chatWithFallback(
    [
      { role: "system", content: systemPrompt + "\n\n## 特殊指示\n你正在回覆一则社群贴文留言。请生成一则友善的私讯内容，感谢对方的留言并提供相关信息。保持简短。" },
      { role: "user", content: commentText },
    ],
    {
      primary: {
        provider: config.aiProvider,
        config: { apiKey: getApiKeyForProvider(config.aiProvider), maxTokens: 500, temperature: 0.7 },
      },
      backup: config.fallbackProvider
        ? {
            provider: config.fallbackProvider,
            config: { apiKey: getApiKeyForProvider(config.fallbackProvider), maxTokens: 500 },
          }
        : undefined,
      fallbackMessage: config.fallbackMessage,
      maxRetries: config.maxRetries,
      timeoutMs: config.timeoutMs,
    }
  );

  return result.content;
}
