import type { LlmCompleteOptions, LlmProvider } from "@/lib/llm/types";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "qwen3:4b-instruct";

type OllamaChatResponse = {
  message?: { content?: string };
  error?: string;
};

function stripThink(text: string) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export class OllamaProvider implements LlmProvider {
  readonly id = "ollama";

  constructor(
    private readonly baseUrl = (process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, ""),
    private readonly model = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL,
  ) {}

  async complete(system: string, user: string, options: LlmCompleteOptions = {}): Promise<string | null> {
    const controller = new AbortController();
    const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? 180_000);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          stream: false,
          format: "json",
          keep_alive: "10m",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          options: {
            temperature: options.temperature ?? 0.3,
            num_predict: options.maxTokens ?? 900,
          },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as OllamaChatResponse;
      if (data.error) return null;
      const text = stripThink(data.message?.content ?? "");
      return text || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
