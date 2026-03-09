/**
 * Insights API
 * GET /api/insights?brandId=xxx&days=7
 *
 * Returns aggregated stats for the dashboard:
 * - Conversation counts by status
 * - Message volume (AI vs Human vs Contact)
 * - Quality flag distribution
 * - Uncovered topics (top N)
 * - Daily message trend
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session }) => {
  const { searchParams } = req.nextUrl;
  const brandId = searchParams.get("brandId");
  if (!brandId) {
    throw new AppError("VALIDATION_ERROR", "brandId required");
  }

  const member = await prisma.brandMember.findUnique({
    where: { userId_brandId: { userId: session.user.id, brandId } },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此品牌");
  }

  const days = Math.min(90, Math.max(1, parseInt(searchParams.get("days") || "7")));
  const since = new Date();
  since.setDate(since.getDate() - days);

  // ── Parallel queries ──
  const [
    convByStatus,
    totalConversations,
    msgBySender,
    totalMessages,
    dailyMessages,
    qualityFlagged,
    uncoveredTopics,
    customerCount,
  ] = await Promise.all([
    // 1. Conversations grouped by status
    prisma.conversation.groupBy({
      by: ["status"],
      where: { brandId },
      _count: true,
    }),

    // 2. Total conversations in period
    prisma.conversation.count({
      where: { brandId, createdAt: { gte: since } },
    }),

    // 3. Messages grouped by sender type (in period)
    prisma.message.groupBy({
      by: ["senderType"],
      where: { conversation: { brandId }, createdAt: { gte: since } },
      _count: true,
    }),

    // 4. Total messages in period
    prisma.message.count({
      where: { conversation: { brandId }, createdAt: { gte: since } },
    }),

    // 5. Daily message counts (raw SQL for date grouping)
    prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
      `SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
       FROM "Message"
       WHERE "conversationId" IN (
         SELECT id FROM "Conversation" WHERE "brandId" = $1
       )
       AND "createdAt" >= $2
       GROUP BY DATE("createdAt")
       ORDER BY day ASC`,
      brandId,
      since,
    ),

    // 6. Conversations with quality flags
    prisma.conversation.count({
      where: {
        brandId,
        qualityFlags: { isEmpty: false },
        createdAt: { gte: since },
      },
    }),

    // 7. Top uncovered topics
    prisma.uncoveredTopic.findMany({
      where: { brandId, status: "PENDING" },
      orderBy: { count: "desc" },
      take: 10,
      select: { id: true, topic: true, count: true, suggestedSection: true, createdAt: true },
    }),

    // 8. Unique customers
    prisma.customerProfile.count({ where: { brandId } }),
  ]);

  // ── Transform results ──
  const statusMap: Record<string, number> = {};
  for (const row of convByStatus) {
    statusMap[row.status] = row._count;
  }

  const senderMap: Record<string, number> = {};
  for (const row of msgBySender) {
    senderMap[row.senderType] = row._count;
  }

  const aiMessages = senderMap["AI"] || 0;
  const humanMessages = senderMap["HUMAN"] || 0;
  const contactMessages = senderMap["CONTACT"] || 0;
  const aiReplyRate = contactMessages > 0
    ? Math.round((aiMessages / contactMessages) * 100)
    : 0;

  const trend = dailyMessages.map((row) => ({
    day: String(row.day).slice(0, 10),
    count: Number(row.count),
  }));

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    conversations: {
      total: Object.values(statusMap).reduce((a, b) => a + b, 0),
      newInPeriod: totalConversations,
      byStatus: {
        aiActive: statusMap["AI_ACTIVE"] || 0,
        humanTakeover: statusMap["HUMAN_TAKEOVER"] || 0,
        closed: statusMap["CLOSED"] || 0,
      },
    },
    messages: {
      total: totalMessages,
      ai: aiMessages,
      human: humanMessages,
      contact: contactMessages,
      aiReplyRate,
    },
    quality: {
      flaggedConversations: qualityFlagged,
    },
    uncoveredTopics,
    customers: customerCount,
    trend,
  });
});