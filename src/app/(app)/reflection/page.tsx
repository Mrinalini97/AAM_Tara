import { createServerSupabase } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { SelfReport } from "@/lib/types";

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
  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Your relationship profile</p>
        <h1 className="mt-3 font-serif text-4xl">A picture of what you said matters</h1>
        <p className="mt-3 text-sm text-ink-soft">These observations are generated from your responses. They are not a diagnosis, a score, or a prediction.</p>
      </header>
      <section>
        <h2 className="font-serif text-2xl">Your relationship orientation</h2>
        <p className="mt-4 leading-relaxed text-ink-soft">{report.orientation}</p>
      </section>
      {report.dimensionSummaries && report.dimensionSummaries.length > 0 ? (
        <section>
          <h2 className="font-serif text-2xl">By area of life</h2>
          <p className="mt-2 text-sm text-ink-soft">Summaries from your answers, grouped by questionnaire section.</p>
          <div className="mt-5 space-y-6">
            {report.dimensionSummaries.map((dim) => (
              <div key={dim.dimension}>
                <h3 className="text-sm uppercase tracking-wider text-sage">{dim.sectionTitle}</h3>
                <p className="mt-2 leading-relaxed text-ink-soft">{dim.summary}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section>
        <h2 className="font-serif text-2xl">What matters most to you</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {report.themes.map((theme) => (
            <Card key={theme.id}>
              <h3 className="font-serif text-xl">{theme.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{theme.description}</p>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Your expectations</h2>
        <div className="mt-4 space-y-5">
          {report.expectations.map((item) => (
            <div key={item.area}>
              <h3 className="text-sm uppercase tracking-wider text-sage">{item.area}</h3>
              <p className="mt-1 leading-relaxed text-ink-soft">{item.summary}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Your strengths as a partner</h2>
        <ul className="mt-4 space-y-3 text-ink-soft">
          {report.strengths.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Areas to reflect on</h2>
        <ul className="mt-4 space-y-3 text-ink-soft">
          {report.reflections.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-serif text-2xl">Your non-negotiables</h2>
        {report.nonNegotiables.length === 0 ? (
          <p className="mt-4 text-ink-soft">You did not mark any area as non-negotiable.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {report.nonNegotiables.map((item) => (
              <li key={item.label} className="rounded-2xl border border-line bg-white/50 px-4 py-3">
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-serif text-2xl">Questions for yourself</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-ink-soft">
          {report.selfQuestions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>
      <Link href="/partner" className="inline-block rounded-full bg-sage px-6 py-3 text-paper">
        Invite a partner
      </Link>
    </div>
  );
}
