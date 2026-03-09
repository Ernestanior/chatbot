import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "test" } }),
}));

vi.mock("@/lib/process-message", () => ({
  processIncomingMessage: vi.fn(),
}));

vi.mock("@/lib/process-comment", () => ({
  processCommentTrigger: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: { webhook: null, standard: null },
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 99, resetAt: 0 }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    platformAccount: {
      findUnique: vi.fn(),
    },
  },
}));

import { GET, POST } from "@/app/api/webhook/meta/route";
import { processIncomingMessage } from "@/lib/process-message";
import { processCommentTrigger } from "@/lib/process-comment";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

describe("GET /api/webhook/meta (verification)", () => {
  it("returns challenge on valid verify token", async () => {
    process.env.META_WEBHOOK_VERIFY_TOKEN = "chatbotai_verify";
    const req = makeRequest(
      "/api/webhook/meta?hub.mode=subscribe&hub.verify_token=chatbotai_verify&hub.challenge=test_challenge_123"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("test_challenge_123");
  });

  it("returns 403 on invalid verify token", async () => {
    const req = makeRequest(
      "/api/webhook/meta?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=abc"
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 403 when mode is not subscribe", async () => {
    const req = makeRequest(
      "/api/webhook/meta?hub.mode=unsubscribe&hub.verify_token=chatbotai_verify&hub.challenge=abc"
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

describe("POST /api/webhook/meta (events)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for any valid payload", async () => {
    const req = makeRequest("/api/webhook/meta", {
      method: "POST",
      body: JSON.stringify({ object: "unknown", entry: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("processes FB message events", async () => {
    vi.mocked(prisma.platformAccount.findUnique).mockResolvedValue({
      id: "acc-1", brandId: "b-1", isActive: true,
      platform: "FACEBOOK", platformUserId: "page-123",
    } as never);

    const req = makeRequest("/api/webhook/meta", {
      method: "POST",
      body: JSON.stringify({
        object: "page",
        entry: [{
          id: "page-123",
          messaging: [{
            sender: { id: "user-456" },
            recipient: { id: "page-123" },
            timestamp: 1700000000000,
            message: { mid: "mid.001", text: "你好" },
          }],
        }],
      }),
    });

    await POST(req);
    expect(processIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        platformAccountId: "acc-1",
        senderId: "user-456",
        messageId: "mid.001",
        messageText: "你好",
        platform: "FACEBOOK",
      })
    );
  });

  it("skips echo messages (sent by page itself)", async () => {
    vi.mocked(prisma.platformAccount.findUnique).mockResolvedValue({
      id: "acc-1", brandId: "b-1", isActive: true,
      platform: "FACEBOOK", platformUserId: "page-123",
    } as never);

    const req = makeRequest("/api/webhook/meta", {
      method: "POST",
      body: JSON.stringify({
        object: "page",
        entry: [{
          id: "page-123",
          messaging: [{
            sender: { id: "page-123" },
            recipient: { id: "user-456" },
            timestamp: 1700000000000,
            message: { mid: "mid.002", text: "Echo", is_echo: true },
          }],
        }],
      }),
    });

    await POST(req);
    expect(processIncomingMessage).not.toHaveBeenCalled();
  });

  it("skips inactive platform accounts", async () => {
    vi.mocked(prisma.platformAccount.findUnique).mockResolvedValue({
      id: "acc-1", isActive: false,
    } as never);

    const req = makeRequest("/api/webhook/meta", {
      method: "POST",
      body: JSON.stringify({
        object: "page",
        entry: [{
          id: "page-123",
          messaging: [{
            sender: { id: "user-456" },
            recipient: { id: "page-123" },
            timestamp: 1700000000000,
            message: { mid: "mid.003", text: "Hello" },
          }],
        }],
      }),
    });

    await POST(req);
    expect(processIncomingMessage).not.toHaveBeenCalled();
  });

  it("handles attachment messages", async () => {
    vi.mocked(prisma.platformAccount.findUnique).mockResolvedValue({
      id: "acc-1", brandId: "b-1", isActive: true,
      platform: "FACEBOOK", platformUserId: "page-123",
    } as never);

    const req = makeRequest("/api/webhook/meta", {
      method: "POST",
      body: JSON.stringify({
        object: "page",
        entry: [{
          id: "page-123",
          messaging: [{
            sender: { id: "user-456" },
            recipient: { id: "page-123" },
            timestamp: 1700000000000,
            message: {
              mid: "mid.004",
              attachments: [{ type: "image", payload: { url: "https://example.com/img.jpg" } }],
            },
          }],
        }],
      }),
    });

    await POST(req);
    expect(processIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        messageType: "image",
        mediaUrl: "https://example.com/img.jpg",
        messageText: "[image]",
      })
    );
  });

  it("processes IG message events", async () => {
    vi.mocked(prisma.platformAccount.findUnique).mockResolvedValue({
      id: "acc-2", brandId: "b-1", isActive: true,
      platform: "INSTAGRAM", platformUserId: "ig-789",
    } as never);

    const req = makeRequest("/api/webhook/meta", {
      method: "POST",
      body: JSON.stringify({
        object: "instagram",
        entry: [{
          id: "ig-789",
          messaging: [{
            sender: { id: "ig-user-1" },
            recipient: { id: "ig-789" },
            timestamp: 1700000000000,
            message: { mid: "ig-mid.001", text: "想了解产品" },
          }],
        }],
      }),
    });

    await POST(req);
    expect(processIncomingMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "INSTAGRAM",
        senderId: "ig-user-1",
        messageText: "想了解产品",
      })
    );
  });
});
