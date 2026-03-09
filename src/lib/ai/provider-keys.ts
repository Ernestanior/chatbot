/**
 * Resolve API key for a given AI provider name
 */
export function getApiKeyForProvider(provider: string): string {
  switch (provider) {
    case "OPENAI":
      return process.env.OPENAI_API_KEY ?? "";
    case "ANTHROPIC":
      return process.env.ANTHROPIC_API_KEY ?? "";
    case "GOOGLE":
      return process.env.GOOGLE_AI_API_KEY ?? "";
    default:
      return process.env.OPENAI_API_KEY ?? "";
  }
}
