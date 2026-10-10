/** Rules produce the first draft. Local LLM (see src/lib/llm) rewrites the stored qualitative self-report. */
export { generateSelfReport } from "@/lib/engine/self-report";
export { generateComparison, generateConversationPrompts } from "@/lib/engine/comparison";
