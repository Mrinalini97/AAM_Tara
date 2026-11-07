"use client";

import { useState } from "react";

const DIMENSIONS = [
  {
    title: "Values",
    question: "When family duty and personal independence pull in different directions, which do you protect first?",
  },
  {
    title: "Money",
    question: "If one of you earned much more, how should contribution and say over money work?",
  },
  {
    title: "Children",
    question: "What would need to be true before you could feel honest about children with a partner?",
  },
  {
    title: "Family",
    question: "How involved should parents be in a decision that changes both of your lives?",
  },
  {
    title: "Career",
    question: "If one career required a move, whose opportunity would be enough — and who decides?",
  },
  {
    title: "Conflict",
    question: "When you disagree strongly, what does coming back to each other actually look like?",
  },
  {
    title: "Lifestyle",
    question: "What should an ordinary week together protect — rest, people, work, or time apart?",
  },
  {
    title: "Intellect",
    question: "What does it mean to you to be able to think together, not only live together?",
  },
];

export function DimensionGrid() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className="grid border-t border-line sm:grid-cols-2">
      {DIMENSIONS.map((item) => {
        const active = open === item.title;
        return (
          <li key={item.title} className="border-b border-line sm:odd:border-r">
            <button
              type="button"
              aria-expanded={active}
              onClick={() => setOpen(active ? null : item.title)}
              className="group flex min-h-[8.5rem] w-full flex-col items-start px-1 py-8 text-left md:min-h-[10.5rem] md:px-4 md:py-10"
            >
              <span className="font-serif text-2xl text-ink md:text-3xl">{item.title}</span>
              <span
                className={`mt-4 max-w-sm text-sm leading-relaxed text-ink-soft md:text-[0.95rem] ${
                  active ? "block" : "hidden group-hover:block group-focus-visible:block"
                }`}
              >
                {item.question}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
