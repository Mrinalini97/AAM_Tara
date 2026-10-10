import { LandingCta } from "@/components/landing/LandingCta";
import { WordMarquee } from "@/components/landing/WordMarquee";
import { PublicHeader } from "@/components/PublicHeader";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

const BIODATA = ["Education", "Career", "Family", "Interests", "Lifestyle"];

const QUESTIONS = [
  "What does marriage mean to you?",
  "Whose career takes priority when both can't?",
  "How involved should families be?",
  "What does financial independence look like?",
  "Do you want children, and how do you imagine raising them?",
  "What happens when you strongly disagree?",
];

const DIMENSIONS = [
  {
    title: "Values & Lifestyle",
    body: "What matters to you, and what you want your life together to stand for, and the everyday life you actually want,",
  },
  {
    title: "Life & Career",
    body: "Ambitions, priorities, flexibility, relocation and the life you want to build.",
  },
  {
    title: "Family",
    body: "Expectations, boundaries and the role families play in your marriage.",
  },
  {
    title: "Money",
    body: "Financial priorities, independence and how you imagine managing money together.",
  },
  {
    title: "Children & Parenting",
    body: "Whether you want children and what you expect parenthood to look like.",
  },
  {
    title: "Communication & Conflict",
    body: "How you handle disagreement, difficult conversations and emotional moments.",
  },
];

const PERSPECTIVES = [
  {
    n: "01",
    title: "Where you align",
    body: "The values, priorities and expectations you naturally share.",
  },
  {
    n: "02",
    title: "Where you differ",
    body: "Not red flags. Not deal-breakers. Just differences worth understanding.",
  },
  {
    n: "03",
    title: "What deserves a conversation",
    body: "The areas where your expectations may need a deeper discussion.",
  },
  {
    n: "04",
    title: "Questions you haven't asked yet",
    body: "Personalised prompts based on your perspectives, because sometimes knowing what to ask is more valuable than being given an answer.",
  },
];

const SCORE_QUESTIONS = [
  "Does it tell you who should move for a career opportunity?",
  "How you'll handle family expectations?",
  "How you'll approach money?",
  "What happens when you disagree?",
];

const STEPS = [
  {
    n: "01",
    title: "Reflect",
    body: "Answer thoughtful questions about what matters to you, independently and honestly.",
  },
  {
    n: "02",
    title: "Understand",
    body: "Get a qualitative view of your own priorities, expectations and relationship preferences.",
  },
  {
    n: "03",
    title: "Compare",
    body: "Invite a potential partner and explore where your perspectives align and differ.",
  },
  {
    n: "04",
    title: "Discuss",
    body: "Discover the conversations that matter before making a decision.",
  },
  {
    n: "05",
    title: "Decide",
    body: "Take what you've learned and make the decision for yourself.",
  },
];

const NOT_THIS = [
  { title: "Not a matrimonial app.", body: "We're not here to show you profiles." },
  { title: "Not a dating app.", body: "We're not here to help you swipe." },
  { title: "Not counselling.", body: "We're not here to fix a relationship." },
];

const PRIVACY = [
  "Your profile isn't visible to other users.",
  "You can delete your profile and responses whenever you want.",
  "Deleting your profile removes your information from the platform.",
];

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

  const start = signedIn ? "/discover" : "/signup";

  return (
    <div className="min-h-screen">
      <PublicHeader signedIn={signedIn} tone="dark" />

      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-flare/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-24 md:pt-14">
          <h1 className="animate-rise font-serif text-[18vw] leading-[0.8] tracking-[-0.04em] text-paper md:text-[9.5rem] lg:text-[11rem]">
            BIMBAM
          </h1>
          <div className="mt-4 h-1.5 w-20 animate-[pulse-line_2.4s_ease-in-out_infinite] bg-flare" />
          <p className="mt-6 max-w-lg text-base leading-relaxed text-paper/75 md:text-lg">
            In a world full of Bumbles and Tinders, use Bimbam!
          </p>
          <p>
          Reflection, Transperancy and Thoughtfulness are our signature ingredients.
          </p>
          <hr className="my-6 border-t border-gray-300" />
          <section className="bg-flare text-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="max-w-3xl font-serif text-3xl leading-tight md:text-5xl">
            This isn&apos;t about finding “the one.”
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
            It&apos;s about understanding the person you&apos;re considering, and the life you could build together.
          </p>
          <ul className="mt-10 grid gap-3 md:grid-cols-3">
            {NOT_THIS.map((item) => (
              <li key={item.title} className="bg-ink p-5 text-paper">
                <h3 className="font-serif text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-xl text-base font-medium">
            It&apos;s a relationship decision-support platform for people seriously considering marriage.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
            We&apos;re here for the space in between. When you&apos;re seriously considering someone and thinking:
          </p>
          <blockquote className="mt-3 max-w-2xl font-serif text-2xl leading-snug md:text-4xl">
            “What should I understand about us before I decide?”
          </blockquote>
        </div>
      </section>

          <h2 className="mt-10 max-w-2xl font-serif text-3xl leading-tight text-paper md:text-5xl">
            The real compatibility test starts after the biodata.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-paper/70 md:text-base">
            A biodata tells you what someone has done. It doesn&apos;t tell you how they think, what they
            value, what they expect from marriage, or how the two of you might navigate life together.
          </p>
          <p className="mt-4 max-w-xl text-sm font-medium text-gold md:text-base">
            That&apos;s what we help you explore.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <LandingCta href={start}>Explore your compatibility →</LandingCta>
            <p className="text-sm text-paper/55">No swiping. No scores. No “perfect match.”</p>
          </div>
        </div>
      </section>

      <WordMarquee words={BIODATA} />

      <section className="bg-paper">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-12 md:py-20">
          <div className="md:col-span-5">
            <h2 className="font-serif text-3xl leading-tight md:text-4xl">
              Because a biodata can tell you a lot.
            </h2>
            <p className="mt-4 text-sm text-ink-soft">Education. Career. Family. Interests. Lifestyle.</p>
            <p className="mt-5 text-sm leading-relaxed text-ink">
              But some of the questions that matter most don&apos;t fit into a profile.
            </p>
          </div>
          <div className="md:col-span-7">
            <ul className="space-y-2 border-l-2 border-flare pl-5 text-sm leading-relaxed text-ink-soft">
              {QUESTIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-soft">These aren&apos;t profile fields.</p>
            <p className="mt-1 font-serif text-xl text-ink md:text-2xl">
              They&apos;re the things you&apos;ll actually have to live with.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="max-w-3xl font-serif text-3xl leading-tight md:text-5xl">
            Don&apos;t just find things in common. Find out what matters.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-paper/65">
            We help you explore the parts of a relationship that a profile can&apos;t capture.
          </p>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map((item) => (
              <li
                key={item.title}
                className="group border border-white/10 bg-white/5 p-5 transition duration-200 hover:-translate-y-1 hover:border-flare hover:bg-flare hover:text-ink"
              >
                <h3 className="font-serif text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/60 group-hover:text-ink/80">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="font-serif text-3xl leading-tight md:text-5xl">Two perspectives. One conversation.</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
            You answer independently. They answer independently. Then see what emerges when those two
            perspectives come together.
          </p>
          <div className="mt-10 grid gap-px bg-ink sm:grid-cols-2">
            {PERSPECTIVES.map((item) => (
              <article key={item.title} className="bg-paper p-6 md:p-8">
                <p className="font-serif text-4xl text-flare">{item.n}</p>
                <h3 className="mt-3 font-serif text-2xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="font-serif text-3xl leading-tight md:text-5xl">No compatibility score.</h2>
          <p className="mt-8 font-serif text-[22vw] leading-none tracking-tight text-flare/90 line-through decoration-paper/80 md:text-[10rem]">
            87%
          </p>
          <p className="text-sm uppercase tracking-[0.3em] text-paper/50">compatible</p>
          <p className="mt-6 max-w-xl text-base text-paper">
            Because what does 87% compatible actually tell you?
          </p>
          <ul className="mt-4 max-w-xl space-y-1.5 text-sm leading-relaxed text-paper/60">
            {SCORE_QUESTIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-gold">Relationships aren&apos;t a percentage.</p>
          <p className="mt-2 max-w-xl font-serif text-2xl leading-snug md:text-3xl">
            We don&apos;t decide for you. We help you make a better-informed decision.
          </p>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-16 bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="max-w-2xl font-serif text-3xl leading-tight md:text-4xl">
            Start with yourself. Then understand each other.
          </h2>
          <ol className="mt-10 divide-y divide-ink/10 border-y border-ink/10">
            {STEPS.map((step) => (
              <li key={step.n} className="grid gap-2 py-5 sm:grid-cols-[4.5rem_10rem_1fr] sm:items-baseline">
                <p className="font-serif text-2xl text-flare">{step.n}</p>
                <h3 className="font-serif text-xl">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-flare text-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h2 className="max-w-3xl font-serif text-3xl leading-tight md:text-5xl">
            This isn&apos;t about finding “the one.”
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
            It&apos;s about understanding the person you&apos;re considering, and the life you could build together.
          </p>
          <ul className="mt-10 grid gap-3 md:grid-cols-3">
            {NOT_THIS.map((item) => (
              <li key={item.title} className="bg-ink p-5 text-paper">
                <h3 className="font-serif text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-xl text-base font-medium">
            It&apos;s a relationship decision-support platform for people seriously considering marriage.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/80">
            We&apos;re here for the space in between. When you&apos;re seriously considering someone and thinking:
          </p>
          <blockquote className="mt-3 max-w-2xl font-serif text-2xl leading-snug md:text-4xl">
            “What should I understand about us before I decide?”
          </blockquote>
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <h2 className="max-w-3xl font-serif text-3xl leading-tight md:text-5xl">
            Before you decide about them, understand what you&apos;re deciding about.
          </h2>
          <div className="mt-8">
            <LandingCta href={start}>Start exploring →</LandingCta>
          </div>
          <p className="mt-4 text-sm text-paper/55">
            Thoughtful questions. Honest perspectives. Better conversations.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
          <p className="text-xs uppercase tracking-[0.28em] text-flare">Private by design.</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
          Thinking honestly requires feeling safe enough to be honest.
          </p>
     
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink">
            Your profile is private by default. Only your potential partner can see it, after you both complete the reflection questionnaire.
          </p>
          <p className="mt-3 max-w-xl text-sm text-ink">You stay in control.</p>
          <ul className="mt-4 max-w-xl space-y-1.5 text-sm leading-relaxed text-ink-soft">
            {PRIVACY.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-5 max-w-xl text-sm text-ink-soft">
            No hidden sharing. No permanent profiles. Just your space to reflect.
          </p>
        </div>
      </section>
    </div>
  );
}
