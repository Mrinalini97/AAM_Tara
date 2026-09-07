import { QuestionnaireClient } from "@/components/questionnaire/QuestionnaireClient";
import { createServerSupabase } from "@/lib/supabase/server";
import { QUESTIONS } from "@/lib/questions/data";
import { redirect } from "next/navigation";
import type { AnswerValue } from "@/lib/types";
import { ensureAssessment } from "@/app/actions/core";

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
  const startIndex = Math.min(assessment.current_index ?? 0, QUESTIONS.length - 1);

  return <QuestionnaireClient startIndex={startIndex} saved={saved} />;
}
