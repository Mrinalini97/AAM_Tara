import { QuestionnaireClient } from "@/components/questionnaire/QuestionnaireClient";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AnswerValue } from "@/lib/types";
import { ensureAssessment } from "@/app/actions/core";
import { visibleQuestions } from "@/lib/questions/visibility";

export const maxDuration = 300;

export default async function QuestionnairePage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/questionnaire");

  await ensureAssessment();
  const { data: assessment } = await supabase.from("assessments").select("*").eq("user_id", user.id).single();
  if (assessment.status === "completed") redirect("/reflection");

  const { data: rows } = await supabase.from("answers").select("question_id, value").eq("assessment_id", assessment.id);
  const saved: Record<string, AnswerValue> = {};
  for (const row of rows ?? []) saved[row.question_id] = row.value as AnswerValue;
  const visibleCount = visibleQuestions(saved).length;
  const startIndex = Math.min(assessment.current_index ?? 0, Math.max(visibleCount - 1, 0));

  return <QuestionnaireClient startIndex={startIndex} saved={saved} />;
}
