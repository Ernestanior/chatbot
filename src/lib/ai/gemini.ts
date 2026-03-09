import type { AIProvider, AIMessage, AIProviderConfig, AIResponse } from "./types";

export class GeminiProvider implements AIProvider {
  name = "gemini";

  async chat(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse> {
    const apiKey = config.apiKey;
    const model = config.model ?? "gemini-2.0-flash";

    // Separate system instruction from conversation messages
    const systemMsg = messages.find((m) => m.role === "system")?.content;
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    const start = Date.now();

    const body: Record<string, unknown> = {
      contents: chatMessages,
      generationConfig: {
        maxOutputTokens: config.maxTokens ?? 1024,
        temperature: config.temperature ?? 0.7,
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg }] };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Gemini API error ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokens = data.usageMetadata?.totalTokenCount;

    return {
      content: text,
      provider: this.name,
      tokensUsed: tokens,
      latencyMs: Date.now() - start,
    };
  }
}
