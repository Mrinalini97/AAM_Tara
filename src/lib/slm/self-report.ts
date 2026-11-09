import { QUESTION_BY_ID, QUESTIONS } from "@/lib/questions/data";
import { formatAnswerValue } from "@/lib/questions/format-answer";
import { isQuestionVisible } from "@/lib/questions/visibility";
import { completeQualitativeReport } from "@/lib/llm";
import {
  SECTION_TITLES,
  enforceWordCap,
  listUncertainAnswers,
  visibleWordCount,
} from "@/lib/engine/self-report";
import type { Dimension, DimensionSummary, ReflectionPoint, SelfReport, StoredAnswer } from "@/lib/types";

const SYSTEM = `You rewrite one person's post-questionnaire self-reflection. Voice is second person.
The page has two parts only, about 600 words, hard cap 700. No introduction. No conclusion.

1. Dimension paragraphs, in the order given. One short paragraph per dimension that has answers.
2 to 3 sentences. If a dimension is thin, one sentence.
Say what the answers commit them to, and what they leave open.
Do not repeat questionnaire wording. Do not quote option labels.
Do not write an uncertain or undecided answer as a settled preference. Name that it is open in the paragraph. Leave the sitting-with to Reflection points.

2. Reflection points. Each point is an observation (one or two sentences) and one question.
Aim for 4 to 7 points, inside the word cap. Order: uncertainty, then conflicts, then gaps between an expectation and a priority.
Drop a category only when the answers do not support it. Do not invent a conflict or a gap.

Uncertainty is mandatory when present. Every questionId in the uncertain list must be covered by questionIds on a point.
The observation names the topic and that it is still open. The question asks what would make it clearer.
Do not treat not-knowing as a flaw, a delay, or a lack of readiness.
Do not recast "it depends" as flexibility, or as a strength, unless other settled answers in that same dimension also show flexibility. Even then, do not praise it.

Conflicts: answers in different dimensions that pull against each other. State both sides. The question asks how they want those two to sit together.
Do not call the preferences incompatible. Do not tell them which one to drop.

Gaps: a stated expectation that does not line up with a life priority, or a difference between what they ideally want and what they marked as genuinely important.
Name both sides. The question asks which of the two they would protect if only one could hold.

Avoid: "you said", copied option labels, flattery, generic lines that could fit anyone, diagnosis, prediction, advice about what they should want, em dashes, and therapy clichés (journey, hold space, lean in, authentic self).
Avoid "thoughtful mix", "appears to matter", "shows up as important", "worth treating with clarity", "part of how you imagine".
If you are over 700 words, shorten dimension paragraphs before you remove reflection points.
Return valid JSON only, no markdown fences.`;

const SECTION_ORDER = Object.keys(SECTION_TITLES) as Dimension[];

function answersForDimension(dimension: Dimension, answers: StoredAnswer[]) {
  const ids = new Set(QUESTIONS.filter((question) => question.dimension === dimension && isQuestionVisible(question, answers)).map((question) => question.id));
  return answers.filter((answer) => ids.has(answer.questionId));
}

function formatDimension(dimension: Dimension, answers: StoredAnswer[]) {
  return answersForDimension(dimension, answers)
    .map((answer) => {
      const question = QUESTION_BY_ID[answer.questionId];
      return [`Question (${answer.questionId}): ${question?.question ?? answer.questionId}`, `Answer: ${formatAnswerValue(answer.questionId, answer.value)}`].join("\n");
    })
    .join("\n\n");
}

function stripJsonFence(text: string) {
  const trimmed = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start >= 0 && end > start) return withoutFence.slice(start, end + 1);
  return withoutFence;
}

function cleanProse(text: string) {
  return text.replace(/\s*[—–]\s*/g, ", ").replace(/\s+/g, " ").trim();
}

function asQuestionIds(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  const ids = value.filter((item): item is string => typeof item === "string" && item.length > 0);
  return ids.length ? ids : undefined;
}

function asPoints(value: unknown): ReflectionPoint[] {
  if (!Array.isArray(value)) return [];
  const points: ReflectionPoint[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as { observation?: unknown; question?: unknown; questionIds?: unknown };
    const observation = typeof record.observation === "string" ? cleanProse(record.observation) : "";
    const question = typeof record.question === "string" ? cleanProse(record.question) : "";
    if (!observation || !question) continue;
    points.push({ observation, question, questionIds: asQuestionIds(record.questionIds) });
  }
  return points;
}

function mentionsOpenness(text: string) {
  return /open|not sure|not certain|depends|unsettled|have not|haven't|prefer not|clearer|not named|not thought|rather not|unnamed/i.test(text);
}

function coveredIds(points: ReflectionPoint[], uncertain: ReturnType<typeof listUncertainAnswers>) {
  const covered = new Set<string>();
  for (const point of points) {
    for (const id of point.questionIds ?? []) covered.add(id);
  }
  for (const point of points) {
    const text = `${point.observation} ${point.question}`.toLowerCase();
    if (!mentionsOpenness(text)) continue;
    const hit = uncertain.find((item) => !covered.has(item.questionId) && item.anchors.some((anchor) => text.includes(anchor)));
    if (hit) covered.add(hit.questionId);
  }
  return covered;
}

function withReflections(report: SelfReport, reflectionPoints: ReflectionPoint[]): SelfReport {
  return {
    ...report,
    reflectionPoints,
    reflections: reflectionPoints.map((point) => `${point.observation} ${point.question}`),
  };
}

/**
 * Apply a model JSON rewrite onto the rules draft.
 * If the model returns nothing usable, the rules draft is kept.
 * Uncertain answers the model skips are appended from the rules draft before save.
 */
export function rewriteSelfReportFromModel(base: SelfReport, answers: StoredAnswer[], raw: string | null): SelfReport {
  if (!raw?.trim()) return base;

  let parsed: { dimensions?: unknown; reflectionPoints?: unknown };
  try {
    parsed = JSON.parse(stripJsonFence(raw)) as { dimensions?: unknown; reflectionPoints?: unknown };
  } catch {
    return base;
  }

  const modelDimensions = new Map<Dimension, string>();
  if (Array.isArray(parsed.dimensions)) {
    for (const item of parsed.dimensions) {
      if (!item || typeof item !== "object") continue;
      const record = item as { dimension?: unknown; summary?: unknown };
      if (typeof record.dimension !== "string" || typeof record.summary !== "string") continue;
      if (!(record.dimension in SECTION_TITLES)) continue;
      const summary = cleanProse(record.summary);
      if (summary) modelDimensions.set(record.dimension as Dimension, summary);
    }
  }

  const modelPoints = asPoints(parsed.reflectionPoints);
  if (modelDimensions.size === 0 && modelPoints.length === 0) return base;

  const baseSummaries = new Map((base.dimensionSummaries ?? []).map((item) => [item.dimension, item]));
  const dimensionSummaries: DimensionSummary[] = [];
  for (const dimension of SECTION_ORDER) {
    const existing = baseSummaries.get(dimension);
    const summary = modelDimensions.get(dimension) || existing?.summary;
    if (!summary) continue;
    if (!existing && answersForDimension(dimension, answers).length === 0) continue;
    dimensionSummaries.push({
      dimension,
      sectionTitle: SECTION_TITLES[dimension],
      summary,
    });
  }

  const uncertain = listUncertainAnswers(answers);
  const covered = coveredIds(modelPoints, uncertain);
  const missing = uncertain
    .filter((item) => !covered.has(item.questionId))
    .map((item) => ({ observation: item.observation, question: item.question, questionIds: [item.questionId] }));
  const reflectionPoints = modelPoints.length > 0 ? [...missing, ...modelPoints] : (base.reflectionPoints ?? []);

  return enforceWordCap(
    withReflections(
      {
        ...base,
        orientation: "",
        dimensionSummaries,
        generatedBy: "hybrid",
      },
      reflectionPoints,
    ),
  );
}

export async function enrichSelfReportWithSlm(base: SelfReport, answers: StoredAnswer[]): Promise<SelfReport> {
  const uncertain = listUncertainAnswers(answers).map((item) => ({
    questionId: item.questionId,
    topic: item.topic,
    observation: item.observation,
    question: item.question,
  }));

  const sections = SECTION_ORDER.map((dimension) => {
    const block = formatDimension(dimension, answers);
    return { dimension, sectionTitle: SECTION_TITLES[dimension], block };
  }).filter((section) => section.block.length > 0);

  const prompt = `${sections.map((section) => `## ${section.sectionTitle} (${section.dimension})\n${section.block}`).join("\n\n")}

Uncertain answers that must appear as reflection points. Put each questionId in questionIds. One point may list both career_goals and relocation_career when both are the same open move. Do not drop any other questionId.
${JSON.stringify(uncertain)}

Rules draft to rewrite. Keep every uncertain topic open. Do not copy it if it quotes a label or treats an open answer as settled.
${JSON.stringify({
  dimensions: base.dimensionSummaries ?? [],
  reflectionPoints: (base.reflectionPoints ?? []).map((point) => ({
    observation: point.observation,
    question: point.question,
    questionIds: point.questionIds ?? [],
  })),
  wordCount: visibleWordCount(base),
})}

Return JSON:
{"dimensions":[{"dimension":"id","sectionTitle":"title","summary":"2-3 sentences"}],"reflectionPoints":[{"observation":"string","question":"string","questionIds":["id"]}]}`;

  const raw = await completeQualitativeReport(SYSTEM, prompt, { maxTokens: 2200 });
  return rewriteSelfReportFromModel(base, answers, raw);
}
