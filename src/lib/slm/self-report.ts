import { QUESTIONS } from "@/lib/questions/data";
import { formatAnswerValue } from "@/lib/questions/format-answer";
import { completeQualitativeReport } from "@/lib/llm";
import type { Dimension, DimensionSummary, SelfReport, StoredAnswer, ThemeCard } from "@/lib/types";

const SYSTEM = `You write relationship reflection for one person from their questionnaire answers.
Rules:
- Do not diagnose, score, or predict compatibility.
- Use "you" language.
- Be specific to THIS person's wording. Name the option they chose, what they ranked first, or how they rated importance.
- A stranger who has not seen the answers should be able to tell which choices this person made.
- Do not write filler that would fit anyone ("appears to matter", "shows up as important", "worth treating with clarity", "part of how you imagine").
- Do not use em dashes.
- No bullet lists.
Return valid JSON only, no markdown fences.`;

function answersForDimension(dimension: Dimension, answers: StoredAnswer[]) {
  const ids = new Set(QUESTIONS.filter((q) => q.dimension === dimension).map((q) => q.id));
  return answers.filter((a) => ids.has(a.questionId));
}

function fallbackForSection(base: SelfReport, sectionTitle: string) {
  return (
    base.expectations.find((e) => e.area.toLowerCase().includes(sectionTitle.split(" ")[0]?.toLowerCase() ?? ""))
      ?.summary ?? `Your answers in ${sectionTitle} suggest priorities worth discussing with a partner.`
  );
}

function formatAllAnswers(answers: StoredAnswer[]) {
  return answers
    .map((a) => {
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      return `Q: ${q?.question ?? a.questionId}\nA: ${formatAnswerValue(a.questionId, a.value)}`;
    })
    .join("\n");
}

export async function enrichSelfReportWithSlm(base: SelfReport, answers: StoredAnswer[]): Promise<SelfReport> {
  const dimensions = [...new Set(QUESTIONS.map((q) => q.dimension))];
  const sections = dimensions.map((dimension) => {
    const sectionTitle = QUESTIONS.find((q) => q.dimension === dimension)?.sectionTitle ?? dimension;
    const dimAnswers = answersForDimension(dimension, answers);
    const block = formatAllAnswers(dimAnswers);
    return { dimension, sectionTitle, block };
  });

  const prompt = `${sections
    .filter((s) => s.block.length > 0)
    .map((s) => `## ${s.sectionTitle} (${s.dimension})\n${s.block}`)
    .join("\n\n")}

Theme cards to rewrite (keep id and title; replace description with 2-4 sentences grounded in the answers above):
${JSON.stringify(base.themes)}

Return JSON:
{
  "orientation": "3-5 sentences. Mention at least two concrete choices from the answers.",
  "dimensions": [{"dimension":"id","sectionTitle":"title","summary":"2-4 sentences that cite this section's actual answers"}],
  "themes": [{"id":"string","title":"string","description":"2-4 sentences that cite the actual answers behind this theme"}]
}`;

  const raw = await completeQualitativeReport(SYSTEM, prompt, { maxTokens: 2800 });
  if (!raw) return base;

  try {
    const parsed = JSON.parse(stripJsonFence(raw)) as {
      orientation?: string;
      dimensions?: DimensionSummary[];
      themes?: ThemeCard[];
    };
    const summaries: DimensionSummary[] = (parsed.dimensions ?? []).map((d) => ({
      dimension: d.dimension,
      sectionTitle: d.sectionTitle,
      summary: d.summary || fallbackForSection(base, d.sectionTitle),
    }));

    const rewritten = new Map((parsed.themes ?? []).map((theme) => [theme.id, theme.description?.trim()]));
    const themes = base.themes.map((theme) => ({
      ...theme,
      description: rewritten.get(theme.id) || theme.description,
    }));

    if (summaries.length === 0 && !parsed.orientation && rewritten.size === 0) return base;

    return {
      ...base,
      orientation: parsed.orientation?.trim() || base.orientation,
      dimensionSummaries: summaries.length > 0 ? summaries : base.dimensionSummaries,
      themes,
      generatedBy: "hybrid",
    };
  } catch {
    return base;
  }
}

function stripJsonFence(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed;
}
