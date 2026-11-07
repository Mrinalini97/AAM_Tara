import { createServerSupabase } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComparisonContent, ComparisonInsight } from "@/lib/types";

function topicTitles(items: ComparisonInsight[], skipDimensions: string[]) {
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const item of items) {
    if (skipDimensions.includes(item.dimension) || seen.has(item.title)) continue;
    seen.add(item.title);
    titles.push(item.title);
  }
  return titles;
}

export default async function UnderstandUsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/understand-us");

  const { data: comparison } = await supabase
    .from("comparisons")
    .select("id, content")
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!comparison) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Understand us</h1>
        <p className="mt-4 text-ink-soft">
          Shared insights appear after both of you have completed a reflection. You can also read each other&apos;s
          full questionnaire answers once you are both done.
        </p>
        <Link href="/partner" className="mt-6 inline-block text-sage">
          Check partner status
        </Link>
      </div>
    );
  }

  const content = comparison.content as ComparisonContent;
  const similarTopics = topicTitles(content.alignments, ["general"]);
  const differentTopics = topicTitles(content.differences, ["general"]);
  const openTopics = topicTitles(content.explore, ["general", "conversation"]).filter(
    (title) => !similarTopics.includes(title) && !differentTopics.includes(title),
  );

  await supabase.from("comparison_views").upsert(
    { comparison_id: comparison.id, user_id: user.id },
    { onConflict: "comparison_id,user_id", ignoreDuplicates: true },
  );

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Together</p>
        <h1 className="mt-3 font-serif text-4xl">Understand us</h1>
        <p className="mt-3 text-sm text-ink-soft">
          This is not a verdict on whether you should be together. It is a map of themes worth noticing and discussing
          {content.slmEnhanced ? " — summarized with an AI layer from your answers." : "."}
        </p>
        <p className="mt-4 leading-relaxed text-ink">
          Differences do not necessarily mean incompatibility, and similarities do not necessarily mean compatibility.
          They are places to look more carefully.
        </p>
        {similarTopics.length > 0 ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-sage">Similar themes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {similarTopics.map((title) => (
                <span
                  key={title}
                  className="max-w-full break-words rounded-full border border-sage/30 bg-[#e4eee2] px-3 py-1.5 text-sm text-[#243024]"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {differentTopics.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Different themes</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {differentTopics.map((title) => (
                <span
                  key={title}
                  className="max-w-full break-words rounded-full border border-[#d9c48a] bg-[#f8efc8] px-3 py-1.5 text-sm text-[#3a3118]"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {openTopics.length > 0 ? (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Still open</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {openTopics.map((title) => (
                <span
                  key={title}
                  className="max-w-full break-words rounded-full border border-line bg-paper-deep px-3 py-1.5 text-sm text-ink"
                >
                  {title}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {content.narrative?.alignmentsOverview ? (
          <p className="mt-4 leading-relaxed text-ink-soft">{content.narrative.alignmentsOverview}</p>
        ) : null}
      </header>

      <section>
        <h2 className="font-serif text-3xl">Where you align</h2>
        <div className="mt-5 space-y-4">
          {content.alignments.map((item) => (
            <Card key={`${item.title}-${item.dimension}`}>
              <h3 className="font-serif text-xl">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Where you see things differently</h2>
        <p className="mt-2 text-sm text-ink-soft">Difference is not labelled as failure.</p>
        {content.narrative?.differencesOverview ? (
          <p className="mt-3 leading-relaxed text-ink-soft">{content.narrative.differencesOverview}</p>
        ) : null}
        <div className="mt-5 space-y-4">
          {content.differences.map((item) => (
            <Card key={`${item.title}-${item.dimension}`}>
              <h3 className="font-serif text-xl">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-3xl">Areas worth exploring</h2>
        <div className="mt-5 space-y-4">
          {content.explore.map((item) => (
            <Card key={`${item.title}-${item.dimension}`}>
              <h3 className="font-serif text-xl">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/conversations" className="inline-block rounded-full bg-sage px-6 py-3 text-paper">
          Open the conversation guide
        </Link>
        <Link href="/partner/responses" className="inline-block rounded-full border border-line px-6 py-3">
          Partner&apos;s answers
        </Link>
      </div>
    </div>
  );
}
