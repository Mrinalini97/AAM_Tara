import { createServerSupabase } from "@/lib/supabase/server";
import { formatAnswerValue } from "@/lib/questions/format-answer";
import { QUESTIONS } from "@/lib/questions/data";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { AnswerValue } from "@/lib/types";

async function getReadyPartnership(userId: string) {
  const supabase = await createServerSupabase();
  const { data: invitation } = await supabase
    .from("partner_invitations")
    .select("id, inviter_id, invitee_id, status")
    .eq("status", "ready")
    .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invitation?.invitee_id) return null;
  const partnerId = invitation.inviter_id === userId ? invitation.invitee_id : invitation.inviter_id;
  const { data: partnerProfile } = await supabase.from("profiles").select("display_name").eq("id", partnerId).maybeSingle();
  return { partnerId, partnerName: partnerProfile?.display_name ?? "Your partner" };
}

export default async function PartnerResponsesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/partner/responses");

  const partnership = await getReadyPartnership(user.id);
  if (!partnership) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Partner&apos;s responses</h1>
        <p className="mt-4 text-ink-soft">
          You can read each other&apos;s questionnaire answers after both reflections are complete and your invitation
          is marked ready. Until then, only your own answers and the shared &ldquo;Understand us&rdquo; summary are
          available.
        </p>
        <Link href="/partner" className="mt-6 inline-block text-sage">
          Partner status
        </Link>
      </div>
    );
  }

  const { data: answerRows, error } = await supabase
    .from("answers")
    .select("question_id, value")
    .eq("user_id", partnership.partnerId);

  if (error) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Partner&apos;s responses</h1>
        <p className="mt-4 text-ink-soft">
          Could not load answers. If you recently deployed, apply the partner-answers RLS policy from{" "}
          <code className="text-xs">supabase/schema.sql</code> in the Supabase SQL editor.
        </p>
      </div>
    );
  }

  const byQuestion = new Map((answerRows ?? []).map((r) => [r.question_id, r.value as AnswerValue]));
  const sections = new Map<string, { title: string; items: { question: string; answer: string }[] }>();

  for (const q of QUESTIONS) {
    const value = byQuestion.get(q.id);
    if (!value) continue;
    const key = q.dimension;
    const block = sections.get(key) ?? { title: q.sectionTitle, items: [] };
    block.items.push({
      question: q.question,
      answer: formatAnswerValue(q.id, value),
    });
    sections.set(key, block);
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Together</p>
        <h1 className="mt-3 font-serif text-4xl">{partnership.partnerName}&apos;s responses</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Human-readable answers from their questionnaire. Use this alongside{" "}
          <Link href="/understand-us" className="text-sage underline-offset-2 hover:underline">
            Understand us
          </Link>{" "}
          — not as a score or verdict.
        </p>
      </header>

      {[...sections.entries()].map(([dimension, section]) => (
        <section key={dimension}>
          <h2 className="font-serif text-2xl">{section.title}</h2>
          <div className="mt-4 space-y-4">
            {section.items.map((item) => (
              <Card key={item.question}>
                <p className="text-sm leading-relaxed text-ink">{item.question}</p>
                <p className="mt-3 leading-relaxed text-ink-soft">{item.answer}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
