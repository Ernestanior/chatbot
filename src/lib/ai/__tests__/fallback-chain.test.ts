import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockOpenAIChat, mockClaudeChat, mockGeminiChat } = vi.hoisted(() => ({
  mockOpenAIChat: vi.fn(),
  mockClaudeChat: vi.fn(),
  mockGeminiChat: vi.fn(),
}));

vi.mock("../openai", () => ({
  OpenAIProvider: class {
    name = "OPENAI";
    chat = mockOpenAIChat;
  },
}));

vi.mock("../claude", () => ({
  ClaudeProvider: class {
    name = "CLAUDE";
    chat = mockClaudeChat;
  },
}));

vi.mock("../gemini", () => ({
  GeminiProvider: class {
    name = "GEMINI";
    chat = mockGeminiChat;
  },
}));

import { getProvider, chatWithFallback } from "../index";

describe("getProvider", () => {
  it("returns OPENAI provider", () => {
    const p = getProvider("OPENAI");
    expect(p.name).toBe("OPENAI");
  });

  it("returns CLAUDE provider", () => {
    const p = getProvider("CLAUDE");
    expect(p.name).toBe("CLAUDE");
  });

  it("returns GEMINI provider", () => {
    const p = getProvider("GEMINI");
    expect(p.name).toBe("GEMINI");
  });

  it("throws for unknown provider", () => {
    expect(() => getProvider("UNKNOWN_AI")).toThrow("Unknown AI provider: UNKNOWN_AI");
  });
});

describe("chatWithFallback", () => {
  const messages = [{ role: "user" as const, content: "Hello" }];

  beforeEach(() => {
    mockOpenAIChat.mockReset();
    mockClaudeChat.mockReset();
  });

  it("returns primary provider result on success", async () => {
    mockOpenAIChat.mockResolvedValueOnce({
      content: "Hi there!",
      provider: "OPENAI",
      latencyMs: 100,
    });

    const result = await chatWithFallback(messages, {
      primary: { provider: "OPENAI", config: { apiKey: "test" } },
      fallbackMessage: "Sorry",
      maxRetries: 0,
      timeoutMs: 5000,
    });

    expect(result.content).toBe("Hi there!");
    expect(result.provider).toBe("OPENAI");
  });

  it("retries primary provider up to maxRetries", async () => {
    mockOpenAIChat
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValueOnce({ content: "OK", provider: "OPENAI", latencyMs: 50 });

    const result = await chatWithFallback(messages, {
      primary: { provider: "OPENAI", config: { apiKey: "test" } },
      fallbackMessage: "Sorry",
      maxRetries: 2,
      timeoutMs: 5000,
    });

    expect(result.content).toBe("OK");
    expect(mockOpenAIChat).toHaveBeenCalledTimes(3);
  });

  it("falls back to backup provider when primary exhausted", async () => {
    mockOpenAIChat.mockRejectedValue(new Error("primary down"));
    mockClaudeChat.mockResolvedValueOnce({
      content: "Backup reply",
      provider: "CLAUDE",
      latencyMs: 200,
    });

    const result = await chatWithFallback(messages, {
      primary: { provider: "OPENAI", config: { apiKey: "test" } },
      backup: { provider: "CLAUDE", config: { apiKey: "test2" } },
      fallbackMessage: "Sorry",
      maxRetries: 0,
      timeoutMs: 5000,
    });

    expect(result.content).toBe("Backup reply");
    expect(result.provider).toBe("CLAUDE");
  });

  it("returns static fallback when all providers fail", async () => {
    mockOpenAIChat.mockRejectedValue(new Error("down"));
    mockClaudeChat.mockRejectedValue(new Error("also down"));

    const result = await chatWithFallback(messages, {
      primary: { provider: "OPENAI", config: { apiKey: "test" } },
      backup: { provider: "CLAUDE", config: { apiKey: "test2" } },
      fallbackMessage: "抱歉，目前无法回覆",
      maxRetries: 0,
      timeoutMs: 5000,
    });

    expect(result.content).toBe("抱歉，目前无法回覆");
    expect(result.provider).toBe("fallback");
    expect(result.latencyMs).toBe(0);
  });

  it("returns static fallback when no backup configured", async () => {
    mockOpenAIChat.mockRejectedValue(new Error("down"));

    const result = await chatWithFallback(messages, {
      primary: { provider: "OPENAI", config: { apiKey: "test" } },
      fallbackMessage: "Offline",
      maxRetries: 0,
      timeoutMs: 5000,
    });

    expect(result.content).toBe("Offline");
    expect(result.provider).toBe("fallback");
  });

  it("times out slow providers", async () => {
    mockOpenAIChat.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        content: "slow", provider: "OPENAI", latencyMs: 9999,
      }), 10000))
    );

    const result = await chatWithFallback(messages, {
      primary: { provider: "OPENAI", config: { apiKey: "test" } },
      fallbackMessage: "Timed out",
      maxRetries: 0,
      timeoutMs: 50,
    });

    expect(result.content).toBe("Timed out");
    expect(result.provider).toBe("fallback");
  }, 10000);
});
