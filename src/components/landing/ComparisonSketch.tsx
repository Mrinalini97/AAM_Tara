const ALIGN = "You both take work seriously, and appear prepared to treat a partner’s career as real — not as background to the relationship.";
const DIFFER =
  "You prefer a distinct household, with family as an important relationship rather than the organising centre of daily life. They place greater weight on family involvement in major decisions.";
const EXPLORE =
  "This is not a verdict. It may simply be a conversation about whose family, how often, and who has the final say in the first years.";

export function ComparisonSketch() {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5">
        <article>
          <p className="text-[11px] uppercase tracking-[0.28em] text-ink-soft">You</p>
          <p className="mt-4 font-serif text-xl leading-snug md:text-2xl">
            A household of your own. Family close — not in every decision.
          </p>
        </article>
        <article>
          <p className="text-[11px] uppercase tracking-[0.28em] text-sage">Them</p>
          <p className="mt-4 font-serif text-xl leading-snug md:text-2xl">
            Marriage as joining families. Advice from elders is part of how life is shaped.
          </p>
        </article>
      </div>

      <div className="space-y-8 border-t border-line pt-8 lg:col-span-7 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-sage">Where you align</p>
          <p className="mt-3 leading-relaxed text-ink-soft">{ALIGN}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-sage">Where you differ</p>
          <p className="mt-3 leading-relaxed text-ink-soft">{DIFFER}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-sage">Worth exploring</p>
          <p className="mt-3 leading-relaxed text-ink-soft">{EXPLORE}</p>
        </div>
      </div>
    </div>
  );
}
