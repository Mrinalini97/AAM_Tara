import { QUESTIONS } from "@/lib/questions/data";
import type { ComparisonContent, StoredAnswer } from "@/lib/types";

type PartnerAnswers = { label: string; answers: StoredAnswer[] };

export async function enrichComparisonWithSlm(
  ruleContent: ComparisonContent,
  _partnerA: PartnerAnswers,
  _partnerB: PartnerAnswers,
): Promise<ComparisonContent> {
  return { ...ruleContent, slmEnhanced: false };
}

export function allQuestionAnswers(rows: { question_id: string; value: unknown }[]): StoredAnswer[] {
  const validIds = new Set(QUESTIONS.map((q) => q.id));
  return rows
    .filter((r) => validIds.has(r.question_id))
    .map((r) => ({
      questionId: r.question_id,
      value: r.value as StoredAnswer["value"],
      tags: [],
    }));
}
