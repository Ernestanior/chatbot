// AI Provider abstraction layer with three-tier fallback chain
// Primary → Backup Provider → Static Fallback Message

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  tokensUsed?: number;
  latencyMs: number;
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProvider {
  name: string;
  chat(messages: AIMessage[], config: AIProviderConfig): Promise<AIResponse>;
}
