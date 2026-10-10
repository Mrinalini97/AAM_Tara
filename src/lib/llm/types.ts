export type LlmCompleteOptions = {
  maxTokens?: number;
  temperature?: number;
};

export interface LlmProvider {
  readonly id: string;
  complete(system: string, user: string, options?: LlmCompleteOptions): Promise<string | null>;
}
