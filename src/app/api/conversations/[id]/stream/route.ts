/**
 * SSE Stream for real-time conversation updates
 * GET /api/conversations/[id]/stream
 *
 * Polls DB every 2s for new messages (lightweight approach).
 * Can be upgraded to Redis pub/sub later.
 *
 * Note: SSE doesn't fit cleanly into apiHandler (returns raw Response, not NextResponse).
 * We use apiHandler for auth + params resolution, then return the SSE stream.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

export const GET = apiHandler(async (req, { session, params }) => {
  const { id } = params!;

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation) {
    throw new AppError("NOT_FOUND", "会话不存在");
  }

  const member = await prisma.brandMember.findUnique({
    where: {
      userId_brandId: { userId: session.user.id, brandId: conversation.brandId },
    },
  });
  if (!member) {
    throw new AppError("FORBIDDEN", "无权访问此会话");
  }

  let lastChecked = new Date();
  let alive = true;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial ping
      send("connected", { conversationId: id });

      const poll = async () => {
        while (alive) {
          try {
            // Check for new messages since last check
            const newMessages = await prisma.message.findMany({
              where: { conversationId: id, createdAt: { gt: lastChecked } },
              orderBy: { createdAt: "asc" },
            });

            if (newMessages.length > 0) {
              send("messages", newMessages);
              lastChecked = newMessages[newMessages.length - 1].createdAt;
            }

            // Check conversation status changes
            const conv = await prisma.conversation.findUnique({
              where: { id },
              select: { status: true, qualityFlags: true },
            });
            if (conv) {
              send("status", { status: conv.status, qualityFlags: conv.qualityFlags });
            }
          } catch (err) {
            console.error(`[SSE] Poll error for conversation ${id}:`, err);
            alive = false;
            break;
          }

          // Wait 2 seconds
          await new Promise((r) => setTimeout(r, 2000));
        }
      };

      poll();

      // Cleanup on abort
      req.signal.addEventListener("abort", () => {
        alive = false;
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});