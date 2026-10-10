import { OllamaProvider } from "@/lib/llm/ollama";
import type { LlmCompleteOptions, LlmProvider } from "@/lib/llm/types";

export type { LlmCompleteOptions, LlmProvider } from "@/lib/llm/types";

/** Register additional local providers here when the model is swapped. */
const PROVIDERS: Record<string, () => LlmProvider> = {
  ollama: () => new OllamaProvider(),
};

export function createLlmProvider(): LlmProvider {
  const name = (process.env.LLM_PROVIDER ?? "ollama").trim().toLowerCase();
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`Unknown LLM_PROVIDER "${name}". Known: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return factory();
}

/** Used only when writing stored qualitative reports, never on ordinary page loads. */
export async function completeQualitativeReport(
  system: string,
  user: string,
  options: LlmCompleteOptions = {},
): Promise<string | null> {
  try {
    return await createLlmProvider().complete(system, user, options);
  } catch {
    return null;
  }
}
