import { readFileSync } from "fs";
import { resolve } from "path";
import type { AnswerValue, StoredAnswer } from "../src/lib/types";

async function main() {
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    const value = trimmed.slice(index + 1);
    if (!process.env[key]) process.env[key] = value.replace(/^"|"$/g, "");
  }

  const emails = ["shivaniaab@gmail.com", "vadhindra@gmail.com"];
  const { createServiceSupabase } = await import("../src/lib/supabase/service");
  const { answersInScope } = await import("../src/lib/questions/visibility");
  const { countTags, extractTags } = await import("../src/lib/engine/tags-from-answers");
  const { generateComparison, generateConversationPrompts } = await import("../src/lib/engine/comparison");
  const { enrichComparisonWithSlm } = await import("../src/lib/slm/comparison");

  const service = createServiceSupabase();
  if (!service) throw new Error("Missing Supabase service credentials.");

  const found: {
    email: string;
    userId: string;
    displayName: string | null;
    weights: Record<string, number>;
    answers: StoredAnswer[];
  }[] = [];

  for (const email of emails) {
    const { data, error } = await service.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    let user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      let page = 2;
      for (;;) {
        const next = await service.auth.admin.listUsers({ page, perPage: 200 });
        if (next.error || !next.data.users.length) break;
        user = next.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (user || next.data.users.length < 200) break;
        page += 1;
      }
    }
    if (!user) throw new Error(`No auth user for ${email}`);

    const { data: assessment, error: assessmentError } = await service
      .from("assessments")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();
    if (assessmentError) throw new Error(assessmentError.message);
    if (!assessment) throw new Error(`No assessment for ${email}`);

    const { data: rows, error: answerError } = await service
      .from("answers")
      .select("question_id, value, tags")
      .eq("assessment_id", assessment.id);
    if (answerError) throw new Error(answerError.message);

    const answers: StoredAnswer[] = (rows ?? []).map((row) => {
      const value = row.value as AnswerValue;
      return {
        questionId: row.question_id,
        value,
        tags: extractTags(row.question_id, value),
      };
    });
    const scoped = answersInScope(answers);
    const weights = countTags(scoped);
    const { data: profile } = await service.from("profiles").select("display_name").eq("id", user.id).maybeSingle();

    found.push({
      email,
      userId: user.id,
      displayName: profile?.display_name ?? null,
      weights,
      answers: scoped,
    });
  }

  const [a, b] = found;
  const ruleContent = generateComparison(a.weights, b.weights);
  const content = await enrichComparisonWithSlm(
    ruleContent,
    { label: a.displayName ?? a.email, answers: a.answers },
    { label: b.displayName ?? b.email, answers: b.answers },
  );
  const prompts = generateConversationPrompts(a.weights, b.weights);

  const { data: invitations } = await service
    .from("partner_invitations")
    .select("id, inviter_id, invitee_id, status")
    .or(
      `and(inviter_id.eq.${a.userId},invitee_id.eq.${b.userId}),and(inviter_id.eq.${b.userId},invitee_id.eq.${a.userId})`,
    );

  const invitation = invitations?.[0];
  let persisted: { comparisonId?: string; invitationId?: string; action: string } = {
    action: "not persisted (no invitation linking these two users)",
  };

  if (invitation) {
    const userAId = invitation.inviter_id;
    const userBId = invitation.invitee_id;
    const { data: existing } = await service
      .from("comparisons")
      .select("id")
      .eq("invitation_id", invitation.id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await service
        .from("comparisons")
        .update({ content })
        .eq("id", existing.id);
      if (updateError) throw new Error(updateError.message);
      await service.from("conversation_prompts").delete().eq("comparison_id", existing.id);
      await service.from("conversation_prompts").insert(
        prompts.map((prompt) => ({
          comparison_id: existing.id,
          category: prompt.category,
          title: prompt.title,
          question: prompt.question,
          sort_order: prompt.sortOrder,
        })),
      );
      persisted = { comparisonId: existing.id, invitationId: invitation.id, action: "updated existing comparison" };
    } else {
      const { data: comparison, error: insertError } = await service
        .from("comparisons")
        .insert({
          invitation_id: invitation.id,
          user_a_id: userAId,
          user_b_id: userBId,
          content,
        })
        .select("id")
        .single();
      if (insertError || !comparison) throw new Error(insertError?.message ?? "Failed to insert comparison");
      await service.from("conversation_prompts").insert(
        prompts.map((prompt) => ({
          comparison_id: comparison.id,
          category: prompt.category,
          title: prompt.title,
          question: prompt.question,
          sort_order: prompt.sortOrder,
        })),
      );
      await service.from("partner_invitations").update({ status: "ready" }).eq("id", invitation.id);
      persisted = { comparisonId: comparison.id, invitationId: invitation.id, action: "inserted comparison" };
    }
  }

  console.log(
    JSON.stringify(
      {
        people: found.map((person) => ({
          email: person.email,
          userId: person.userId,
          displayName: person.displayName,
          answerCount: person.answers.length,
          tags: Object.fromEntries(
            Object.entries(person.weights).sort((left, right) => right[1] - left[1]),
          ),
        })),
        persisted,
        report: content,
        conversationPrompts: prompts,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
