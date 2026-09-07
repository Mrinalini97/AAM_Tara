"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { QUESTIONS } from "@/lib/questions/data";
import { extractTags, isAnswerComplete, countTags } from "@/lib/engine/tags-from-answers";
import { generateSelfReport } from "@/lib/engine/self-report";
import { generateComparison, generateConversationPrompts } from "@/lib/engine/comparison";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AnswerValue, StoredAnswer } from "@/lib/types";

async function requireUser() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to continue.");
  return { supabase, user };
}

export async function ensureAssessment() {
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase.from("assessments").select("*").eq("user_id", user.id).maybeSingle();
  if (existing) return existing;
  const { data, error } = await supabase.from("assessments").insert({ user_id: user.id }).select("*").single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveAnswer(questionId: string, value: AnswerValue, index: number) {
  const { supabase, user } = await requireUser();
  const assessment = await ensureAssessment();
  const tags = extractTags(questionId, value);
  const { error } = await supabase.from("answers").upsert(
    { assessment_id: assessment.id, user_id: user.id, question_id: questionId, value, tags },
    { onConflict: "assessment_id,question_id" },
  );
  if (error) throw new Error(error.message);
  await supabase.from("assessments").update({ current_index: index }).eq("id", assessment.id);
  revalidatePath("/questionnaire");
  return { ok: true };
}

export async function completeAssessment() {
  const { supabase, user } = await requireUser();
  const assessment = await ensureAssessment();
  const { data: rows, error } = await supabase.from("answers").select("question_id, value, tags").eq("assessment_id", assessment.id);
  if (error) throw new Error(error.message);
  const answers: StoredAnswer[] = (rows ?? []).map((row) => ({
    questionId: row.question_id,
    value: row.value as AnswerValue,
    tags: row.tags ?? [],
  }));
  const missing = QUESTIONS.filter((q) => q.required).filter((q) => {
    const found = answers.find((a) => a.questionId === q.id);
    return !isAnswerComplete(q.id, found?.value);
  });
  if (missing.length) throw new Error("Please complete the remaining questions before finishing.");
  const report = generateSelfReport(answers);
  const weights = countTags(answers);
  const { error: profileError } = await supabase.from("relationship_profiles").upsert(
    { user_id: user.id, assessment_id: assessment.id, tags: Object.keys(weights), tag_weights: weights, report },
    { onConflict: "user_id" },
  );
  if (profileError) throw new Error(profileError.message);
  await supabase
    .from("assessments")
    .update({ status: "completed", completed_at: new Date().toISOString(), current_index: QUESTIONS.length })
    .eq("id", assessment.id);
  await maybeBuildComparison(supabase, user.id);
  revalidatePath("/reflection");
  revalidatePath("/home");
  return { ok: true };
}

export async function createPartnerInvitation() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("relationship_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (!profile) throw new Error("Complete your reflection before inviting someone.");
  const { data: existing } = await supabase
    .from("partner_invitations")
    .select("*")
    .eq("inviter_id", user.id)
    .in("status", ["pending", "accepted", "ready"])
    .maybeSingle();
  if (existing) return existing;
  const token = randomBytes(32).toString("base64url");
  const { data, error } = await supabase.from("partner_invitations").insert({ inviter_id: user.id, token }).select("*").single();
  if (error) throw new Error(error.message);
  revalidatePath("/partner");
  return data;
}

export async function acceptInvitation(token: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("accept_invitation", { invite_token: token });
  if (error) throw new Error(error.message);
  revalidatePath("/home");
  return data;
}

type PairSnapshot = {
  ready: boolean;
  user_a_id: string;
  user_b_id: string;
  a?: Record<string, number>;
  b?: Record<string, number>;
};

async function maybeBuildComparison(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
) {
  const { data: invitations } = await supabase
    .from("partner_invitations")
    .select("id")
    .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`);

  for (const invitation of invitations ?? []) {
    const { data: snapshot, error } = await supabase.rpc("pair_tag_weights", { p_invitation_id: invitation.id });
    if (error || !snapshot) continue;
    const pair = snapshot as PairSnapshot;
    if (!pair.ready || !pair.a || !pair.b) continue;
    const { data: existing } = await supabase.from("comparisons").select("id").eq("invitation_id", invitation.id).maybeSingle();
    if (existing) continue;
    const content = generateComparison(pair.a, pair.b);
    const prompts = generateConversationPrompts(pair.a, pair.b);
    const { data: comparison, error: cmpError } = await supabase
      .from("comparisons")
      .insert({ invitation_id: invitation.id, user_a_id: pair.user_a_id, user_b_id: pair.user_b_id, content })
      .select("id")
      .single();
    if (cmpError || !comparison) continue;
    await supabase.from("conversation_prompts").insert(
      prompts.map((prompt) => ({
        comparison_id: comparison.id,
        category: prompt.category,
        title: prompt.title,
        question: prompt.question,
        sort_order: prompt.sortOrder,
      })),
    );
    await supabase.rpc("mark_invitation_ready", { p_invitation_id: invitation.id });
  }
}

export async function setConversationStatus(promptId: string, status: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("conversation_statuses").upsert(
    { prompt_id: promptId, user_id: user.id, status, updated_at: new Date().toISOString() },
    { onConflict: "prompt_id,user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/conversations");
}

export async function savePostReflection(comparisonId: string, selections: string[]) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("post_reflections").upsert(
    { comparison_id: comparisonId, user_id: user.id, selections },
    { onConflict: "comparison_id,user_id" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/conversations");
}

export async function updateDisplayName(displayName: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/profile");
}

export async function deleteAccountData() {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_own_account_data");
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
}

export async function restartAssessment() {
  const { supabase, user } = await requireUser();
  await supabase.from("relationship_profiles").delete().eq("user_id", user.id);
  await supabase.from("assessments").delete().eq("user_id", user.id);
  revalidatePath("/questionnaire");
}
