import { generateSelfReport } from "@/lib/engine/self-report";
import { countTags } from "@/lib/engine/tags-from-answers";
import { enrichSelfReportWithSlm } from "@/lib/slm/self-report";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { AnswerValue, StoredAnswer } from "@/lib/types";

export async function buildRelationshipReport(answers: StoredAnswer[]) {
  const base = generateSelfReport(answers);
  const report = await enrichSelfReportWithSlm(base, answers);
  const weights = countTags(answers);
  return { report, weights };
}

export async function regenerateCompletedReflections() {
  const service = createServiceSupabase();
  if (!service) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to regenerate reports.");
  }

  const { data: assessments, error } = await service
    .from("assessments")
    .select("id, user_id")
    .eq("status", "completed");
  if (error) throw new Error(error.message);

  const results: { userId: string; ok: boolean; error?: string }[] = [];

  for (const assessment of assessments ?? []) {
    try {
      const { data: rows, error: answerError } = await service
        .from("answers")
        .select("question_id, value, tags")
        .eq("assessment_id", assessment.id);
      if (answerError) throw new Error(answerError.message);

      const answers: StoredAnswer[] = (rows ?? []).map((row) => ({
        questionId: row.question_id,
        value: row.value as AnswerValue,
        tags: row.tags ?? [],
      }));
      if (answers.length === 0) {
        results.push({ userId: assessment.user_id, ok: false, error: "No answers" });
        continue;
      }

      const { report, weights } = await buildRelationshipReport(answers);
      const { error: upsertError } = await service.from("relationship_profiles").upsert(
        {
          user_id: assessment.user_id,
          assessment_id: assessment.id,
          tags: Object.keys(weights),
          tag_weights: weights,
          report,
        },
        { onConflict: "user_id" },
      );
      if (upsertError) throw new Error(upsertError.message);
      results.push({ userId: assessment.user_id, ok: true });
    } catch (err) {
      results.push({
        userId: assessment.user_id,
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return {
    total: results.length,
    updated: results.filter((row) => row.ok).length,
    failed: results.filter((row) => !row.ok),
  };
}
