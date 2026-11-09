import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReflectionPoint, SelfReport } from "@/lib/types";

function pointsFrom(report: SelfReport): ReflectionPoint[] {
  if (report.reflectionPoints && report.reflectionPoints.length > 0) return report.reflectionPoints;
  return (report.reflections ?? []).map((line) => ({ observation: line, question: "" }));
}

export default async function ReflectionPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase.from("relationship_profiles").select("report").eq("user_id", user.id).maybeSingle();
  if (!row) {
    return (
      <div>
        <h1 className="font-serif text-4xl">Your relationship profile</h1>
        <p className="mt-4 text-ink-soft">Complete the reflection to see a qualitative picture of your answers.</p>
        <Link href="/discover" className="mt-6 inline-block rounded-full bg-sage px-5 py-2.5 text-paper">
          Start my reflection
        </Link>
      </div>
    );
  }

  const report = row.report as SelfReport;
  const summaries = report.dimensionSummaries ?? [];
  const points = pointsFrom(report);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Your relationship profile</p>
        <h1 className="mt-3 font-serif text-4xl">A picture of what you said matters</h1>
        <p className="mt-3 text-sm text-ink-soft">These observations are generated from your responses. They are not a diagnosis, a score, or a prediction.</p>
      </header>
      {summaries.length > 0 ? (
        <section>
          <h2 className="font-serif text-2xl">Dimension-wise reflections</h2>
          <div className="mt-5 space-y-6">
            {summaries.map((dim) => (
              <div key={dim.dimension}>
                <h3 className="text-sm uppercase tracking-wider text-sage">{dim.sectionTitle}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{dim.summary}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {points.length > 0 ? (
        <section>
          <h2 className="font-serif text-2xl">Reflection points</h2>
          <div className="mt-5 space-y-6">
            {points.map((point) => (
              <div key={`${point.observation}-${point.question}`}>
                <p className="leading-relaxed text-ink-soft">{point.observation}</p>
                {point.question ? <p className="mt-2 leading-relaxed">{point.question}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <Link href="/partner" className="inline-block rounded-full bg-sage px-6 py-3 text-paper">
        Invite a partner
      </Link>
    </div>
  );
}
