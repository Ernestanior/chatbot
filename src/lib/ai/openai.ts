import OpenAI from "openai";
import type { AIProvider, AIMessage, AIProviderConfig, AIResponse } from "./types";

export class OpenAIProvider implements AIProvider {
  name = "openai";

  async chat(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    const client = new OpenAI({ apiKey: config.apiKey });
    const start = Date.now();
    const response = await client.chat.completions.create({
      model: config.model ?? "gpt-4o-mini",
      max_tokens: config.maxTokens ?? 1024,
      temperature: config.temperature ?? 0.7,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return {
      content: response.choices[0]?.message?.content ?? "",
      provider: this.name,
      tokensUsed: response.usage?.total_tokens,
      latencyMs: Date.now() - start,
    };
  }
}
