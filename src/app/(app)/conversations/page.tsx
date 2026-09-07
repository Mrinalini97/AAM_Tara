import { createServerSupabase } from "@/lib/supabase/server";
import { ConversationGuide } from "@/components/conversations/ConversationGuide";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ConversationsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/conversations");

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("id")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comparison) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Conversations worth having</h1>
        <p className="mt-4 text-ink-soft">
          Personalized discussion prompts appear after both reflections are complete.
        </p>
        <Link href="/partner" className="mt-6 inline-block text-sage">
          Invite a partner
        </Link>
      </div>
    );
  }

  const { data: prompts } = await supabase
    .from("conversation_prompts")
    .select("id, category, title, question, sort_order")
    .eq("comparison_id", comparison.id)
    .order("sort_order");

  const { data: statuses } = await supabase
    .from("conversation_statuses")
    .select("prompt_id, status")
    .eq("user_id", user.id);

  const { data: reflection } = await supabase
    .from("post_reflections")
    .select("selections")
    .eq("comparison_id", comparison.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const statusMap: Record<string, string> = {};
  for (const row of statuses ?? []) {
    statusMap[row.prompt_id] = row.status;
  }

  return (
    <ConversationGuide
      comparisonId={comparison.id}
      prompts={(prompts ?? []).map((p) => ({
        id: p.id,
        category: p.category,
        title: p.title,
        question: p.question,
      }))}
      statuses={statusMap}
      initialSelections={reflection?.selections ?? []}
    />
  );
}
