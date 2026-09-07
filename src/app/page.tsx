import { PublicHeader } from "@/components/PublicHeader";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import Link from "next/link";

export default async function LandingPage() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.auth.getUser();
      signedIn = Boolean(data.user);
    } catch {
      signedIn = false;
    }
  }

  return (
    <div className="min-h-screen">
      <PublicHeader signedIn={signedIn} />
      <main className="mx-auto max-w-5xl px-4 pb-24">
        <section className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-8">
            <p className="text-xs uppercase tracking-[0.25em] text-sage">A space for reflection</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ink md:text-6xl">
              Before choosing a life partner, understand yourself.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              Explore your values, expectations, priorities and relationship preferences — then understand
              what really matters when you evaluate a potential partner.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={signedIn ? "/discover" : "/signup"} className="rounded-full bg-sage px-6 py-3 text-paper hover:bg-sage-deep">
                Discover Myself
              </Link>
              <Link href="/how-it-works" className="rounded-full border border-line px-6 py-3 text-ink hover:bg-paper-deep">
                How it works
              </Link>
            </div>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          {[
            { n: "01", title: "Understand Yourself", body: "Answer a guided set of questions about your values, expectations, lifestyle and relationship preferences." },
            { n: "02", title: "Understand Each Other", body: "Invite a prospective partner to complete their own profile, independently, without seeing your answers first." },
            { n: "03", title: "Start Better Conversations", body: "Discover where you align, where you differ, and what you may want to discuss before making an important decision." },
          ].map((step) => (
            <article key={step.n} className="rounded-3xl border border-line bg-white/40 p-6">
              <p className="text-xs tracking-[0.2em] text-sage">{step.n}</p>
              <h2 className="mt-3 font-serif text-2xl">{step.title}</h2>
              <p className="mt-3 leading-relaxed text-ink-soft">{step.body}</p>
            </article>
          ))}
        </section>
        <p className="mt-16 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Tara is not a dating app, and it will not tell you who to marry. It is a private place to think
          clearly — and to talk more honestly — before a life-partner decision.
        </p>
      </main>
    </div>
  );
}
