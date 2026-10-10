"use client";

export function WordMarquee({ words }: { words: string[] }) {
  const row = [...words, ...words, ...words, ...words];
  return (
    <div className="relative overflow-hidden border-y border-ink/10 py-3">
      <div className="animate-marquee flex w-max gap-10 whitespace-nowrap text-sm tracking-[0.22em] text-ink/40 uppercase">
        {row.map((word, i) => (
          <span key={`${word}-${i}`} className="flex items-center gap-10">
            {word}
            <span className="h-1 w-1 rounded-full bg-flare" />
          </span>
        ))}
      </div>
    </div>
  );
}
