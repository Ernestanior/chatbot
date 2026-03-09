import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, AIMessage, AIProviderConfig, AIResponse } from "./types";

export class ClaudeProvider implements AIProvider {
  name = "claude";

  async chat(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    const client = new Anthropic({ apiKey: config.apiKey });
    const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const start = Date.now();
    const response = await client.messages.create({
      model: config.model ?? "claude-sonnet-4-20250514",
      max_tokens: config.maxTokens ?? 1024,
      temperature: config.temperature ?? 0.7,
      system: systemMsg,
      messages: chatMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return {
      content: textBlock?.text ?? "",
      provider: this.name,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      latencyMs: Date.now() - start,
    };
  }
}
