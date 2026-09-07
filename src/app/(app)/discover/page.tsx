import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DiscoverPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/discover");

  const { data: assessment } = await supabase.from("assessments").select("status").eq("user_id", user.id).maybeSingle();
  if (assessment?.status === "completed") redirect("/reflection");

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-sage">Before you begin</p>
      <h1 className="mt-4 font-serif text-4xl leading-tight">This isn’t a personality test.</h1>
      <p className="mt-6 text-lg leading-relaxed text-ink-soft">
        The goal is to help you reflect on what you genuinely want from a long-term relationship.
      </p>
      <ul className="mt-8 space-y-3 text-ink-soft">
        <li>There are no right or wrong answers.</li>
        <li>Answer based on what you believe, rather than what others expect from you.</li>
        <li>The report will help you reflect on your own preferences and expectations.</li>
      </ul>
      <Link href="/questionnaire" className="mt-10 inline-block rounded-full bg-sage px-6 py-3 text-paper hover:bg-sage-deep">
        Start My Reflection
      </Link>
    </div>
  );
}
