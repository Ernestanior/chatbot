import type { AIProvider, AIMessage, AIProviderConfig, AIResponse } from "./types";
import { OpenAIProvider } from "./openai";
import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";

const providers: Record<string, AIProvider> = {
  OPENAI: new OpenAIProvider(),
  CLAUDE: new ClaudeProvider(),
  GOOGLE: new GeminiProvider(),
  GEMINI: new GeminiProvider(),
};

export function getProvider(name: string): AIProvider {
  const p = providers[name];
  if (!p) throw new Error(`Unknown AI provider: ${name}`);
  return p;
}

interface FallbackChainConfig {
  primary: { provider: string; config: AIProviderConfig };
  backup?: { provider: string; config: AIProviderConfig };
  fallbackMessage: string;
  maxRetries: number;
  timeoutMs: number;
}

export async function chatWithFallback(
  messages: AIMessage[],
  chain: FallbackChainConfig
): Promise<AIResponse> {
  // Tier 1: Primary provider
  for (let i = 0; i <= chain.maxRetries; i++) {
    try {
      const provider = getProvider(chain.primary.provider);
      const result = await withTimeout(
        provider.chat(messages, chain.primary.config),
        chain.timeoutMs
      );
      return result;
    } catch (err) {
      console.error(`[AI] Primary ${chain.primary.provider} attempt ${i + 1} failed:`, err);
      if (i === chain.maxRetries) break;
    }
  }

  // Tier 2: Backup provider
  if (chain.backup) {
    try {
      const provider = getProvider(chain.backup.provider);
      const result = await withTimeout(
        provider.chat(messages, chain.backup.config),
        chain.timeoutMs
      );
      return result;
    } catch (err) {
      console.error(`[AI] Backup ${chain.backup.provider} failed:`, err);
    }
  }

  // Tier 3: Static fallback
  return {
    content: chain.fallbackMessage,
    provider: "fallback",
    latencyMs: 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export type { AIMessage, AIResponse, AIProviderConfig } from "./types";
