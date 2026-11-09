import { CoupleReportView } from "@/components/couple/CoupleReportView";
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ComparisonContent } from "@/lib/types";

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

  await supabase.from("comparison_views").upsert(
    { comparison_id: comparison.id, user_id: user.id },
    { onConflict: "comparison_id,user_id", ignoreDuplicates: true },
  );

  return (
    <CoupleReportView
      content={content}
      footer={
        <div className="flex flex-wrap gap-3">
          <Link href="/conversations" className="inline-block rounded-full bg-sage px-6 py-3 text-paper">
            Open the conversation guide
          </Link>
          <Link href="/partner/responses" className="inline-block rounded-full border border-line px-6 py-3">
            Partner&apos;s answers
          </Link>
        </div>
      }
    />
  );
}
