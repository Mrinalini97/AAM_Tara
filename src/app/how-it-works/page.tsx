import { PublicHeader } from "@/components/PublicHeader";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.25em] text-sage">How it works</p>
        <h1 className="mt-4 font-serif text-4xl">Know yourself before choosing someone else.</h1>
        <div className="mt-10 space-y-8 text-lg leading-relaxed text-ink-soft">
          <p>You begin alone. The questions help you notice what you actually want — not what a timeline or a “good match” is supposed to look like.</p>
          <p>There is no compatibility percentage. If you invite someone, they complete the same reflection without seeing your answers. Only then do you see where you align, where you see things differently, and questions worth discussing.</p>
          <p>Differences are not labelled as failures. Similarity is not treated as a green light. The aim is a better conversation, not a prediction about marriage.</p>
        </div>
        <Link href="/signup" className="mt-10 inline-block rounded-full bg-sage px-6 py-3 text-paper">
          Discover Myself
        </Link>
      </main>
    </div>
  );
}
