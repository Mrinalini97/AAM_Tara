import { generateComparison, generateConversationPrompts, type ConversationPromptDraft } from "@/lib/engine/comparison";
import { countTags, extractTags } from "@/lib/engine/tags-from-answers";
import { answersInScope } from "@/lib/questions/visibility";
import { enrichComparisonWithSlm } from "@/lib/slm/comparison";
import { createServiceSupabase } from "@/lib/supabase/service";
import type { AnswerValue, ComparisonContent, StoredAnswer } from "@/lib/types";

export type CoupleReportPerson = {
  userId: string;
  displayName: string | null;
  email: string | null;
  answerCount: number;
};

export type CoupleReportPayload = {
  invitationId: string;
  invitationStatus: string;
  comparisonId: string | null;
  people: [CoupleReportPerson, CoupleReportPerson];
  content: ComparisonContent | null;
  prompts: ConversationPromptDraft[];
};

function serviceClient() {
  const service = createServiceSupabase();
  if (!service) throw new Error("Add SUPABASE_SERVICE_ROLE_KEY to the server environment.");
  return service;
}

async function emailsForIds(
  service: NonNullable<ReturnType<typeof createServiceSupabase>>,
  ids: string[],
) {
  const map = new Map<string, string>();
  const needed = new Set(ids);
  let page = 1;
  while (needed.size) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    for (const user of data.users) {
      if (needed.has(user.id) && user.email) {
        map.set(user.id, user.email);
        needed.delete(user.id);
      }
    }
    if (data.users.length < 200) break;
    page += 1;
  }
  return map;
}

async function answersForUser(
  service: NonNullable<ReturnType<typeof createServiceSupabase>>,
  userId: string,
): Promise<StoredAnswer[]> {
  const { data: assessment, error: assessmentError } = await service
    .from("assessments")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (assessmentError) throw new Error(assessmentError.message);
  if (!assessment) return [];

  const { data: rows, error } = await service
    .from("answers")
    .select("question_id, value")
    .eq("assessment_id", assessment.id);
  if (error) throw new Error(error.message);

  return (rows ?? []).map((row) => {
    const value = row.value as AnswerValue;
    return {
      questionId: row.question_id,
      value,
      tags: extractTags(row.question_id, value),
    };
  });
}

async function loadInvitation(invitationId: string) {
  const service = serviceClient();
  const { data: invitation, error } = await service
    .from("partner_invitations")
    .select("id, inviter_id, invitee_id, status")
    .eq("id", invitationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!invitation) return { service, invitation: null as null };
  if (!invitation.invitee_id) throw new Error("This invitation has not been accepted yet.");
  return { service, invitation: { ...invitation, invitee_id: invitation.invitee_id as string } };
}

async function personSnapshot(
  service: NonNullable<ReturnType<typeof createServiceSupabase>>,
  userId: string,
  emails: Map<string, string>,
  answers: StoredAnswer[],
): Promise<CoupleReportPerson> {
  const { data: profile } = await service.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  return {
    userId,
    displayName: profile?.display_name ?? null,
    email: emails.get(userId) ?? null,
    answerCount: answers.length,
  };
}

export async function loadCoupleReport(invitationId: string): Promise<CoupleReportPayload | null> {
  const { service, invitation } = await loadInvitation(invitationId);
  if (!invitation) return null;

  const emails = await emailsForIds(service, [invitation.inviter_id, invitation.invitee_id]);
  const [inviterAnswers, inviteeAnswers] = await Promise.all([
    answersForUser(service, invitation.inviter_id),
    answersForUser(service, invitation.invitee_id),
  ]);

  const { data: comparison } = await service
    .from("comparisons")
    .select("id, content")
    .eq("invitation_id", invitation.id)
    .maybeSingle();

  let prompts: ConversationPromptDraft[] = [];
  if (comparison) {
    const { data: promptRows } = await service
      .from("conversation_prompts")
      .select("category, title, question, sort_order")
      .eq("comparison_id", comparison.id)
      .order("sort_order", { ascending: true });
    prompts = (promptRows ?? []).map((row) => ({
      category: row.category,
      title: row.title,
      question: row.question,
      sortOrder: row.sort_order,
    }));
  }

  return {
    invitationId: invitation.id,
    invitationStatus: invitation.status,
    comparisonId: comparison?.id ?? null,
    people: [
      await personSnapshot(service, invitation.inviter_id, emails, inviterAnswers),
      await personSnapshot(service, invitation.invitee_id, emails, inviteeAnswers),
    ],
    content: (comparison?.content as ComparisonContent | undefined) ?? null,
    prompts,
  };
}

export async function generateCoupleReport(invitationId: string): Promise<CoupleReportPayload> {
  const { service, invitation } = await loadInvitation(invitationId);
  if (!invitation) throw new Error("Invitation not found.");

  const emails = await emailsForIds(service, [invitation.inviter_id, invitation.invitee_id]);
  const inviterAnswers = answersInScope(await answersForUser(service, invitation.inviter_id));
  const inviteeAnswers = answersInScope(await answersForUser(service, invitation.invitee_id));
  if (inviterAnswers.length === 0 || inviteeAnswers.length === 0) {
    throw new Error("Both partners need questionnaire answers before a couple report can be generated.");
  }

  const inviterWeights = countTags(inviterAnswers);
  const inviteeWeights = countTags(inviteeAnswers);
  const inviter = await personSnapshot(service, invitation.inviter_id, emails, inviterAnswers);
  const invitee = await personSnapshot(service, invitation.invitee_id, emails, inviteeAnswers);

  const ruleContent = generateComparison(inviterWeights, inviteeWeights);
  const content = await enrichComparisonWithSlm(
    ruleContent,
    { label: inviter.displayName ?? inviter.email ?? "Partner A", answers: inviterAnswers },
    { label: invitee.displayName ?? invitee.email ?? "Partner B", answers: inviteeAnswers },
  );
  const prompts = generateConversationPrompts(inviterWeights, inviteeWeights);

  const { data: existing } = await service
    .from("comparisons")
    .select("id")
    .eq("invitation_id", invitation.id)
    .maybeSingle();

  let comparisonId: string;
  if (existing) {
    const { error } = await service.from("comparisons").update({ content }).eq("id", existing.id);
    if (error) throw new Error(error.message);
    comparisonId = existing.id;
    await service.from("conversation_prompts").delete().eq("comparison_id", comparisonId);
  } else {
    const { data: comparison, error } = await service
      .from("comparisons")
      .insert({
        invitation_id: invitation.id,
        user_a_id: invitation.inviter_id,
        user_b_id: invitation.invitee_id,
        content,
      })
      .select("id")
      .single();
    if (error || !comparison) throw new Error(error?.message ?? "Failed to save comparison.");
    comparisonId = comparison.id;
  }

  const { error: promptError } = await service.from("conversation_prompts").insert(
    prompts.map((prompt) => ({
      comparison_id: comparisonId,
      category: prompt.category,
      title: prompt.title,
      question: prompt.question,
      sort_order: prompt.sortOrder,
    })),
  );
  if (promptError) throw new Error(promptError.message);

  await service.from("partner_invitations").update({ status: "ready" }).eq("id", invitation.id);

  return {
    invitationId: invitation.id,
    invitationStatus: "ready",
    comparisonId,
    people: [inviter, invitee],
    content,
    prompts,
  };
}
