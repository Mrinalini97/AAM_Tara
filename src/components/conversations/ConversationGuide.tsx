"use client";

import { savePostReflection, setConversationStatus } from "@/app/actions/core";
import { useState, useTransition } from "react";
import type { ConversationStatus } from "@/lib/types";

const MARKS: { id: ConversationStatus; label: string }[] = [
  { id: "discussed", label: "Discussed" },
  { id: "need_to_discuss", label: "Need to discuss" },
  { id: "not_relevant", label: "Not relevant" },
];

const FEELINGS = [
  "I understand myself better.",
  "I understand my partner better.",
  "We have some important conversations to have.",
  "We discovered differences I hadn’t considered.",
  "I feel more confident about moving forward.",
  "I need more time to reflect.",
];

export function ConversationGuide({
  comparisonId,
  prompts,
  statuses,
  initialSelections,
}: {
  comparisonId: string;
  prompts: { id: string; category: string; title: string; question: string }[];
  statuses: Record<string, string>;
  initialSelections: string[];
}) {
  const [local, setLocal] = useState(statuses);
  const [selected, setSelected] = useState<string[]>(initialSelections);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function mark(promptId: string, status: ConversationStatus) {
    setLocal((prev) => ({ ...prev, [promptId]: status }));
    start(async () => {
      await setConversationStatus(promptId, status);
    });
  }

  function toggleFeeling(line: string) {
    setSelected((prev) =>
      prev.includes(line) ? prev.filter((item) => item !== line) : [...prev, line],
    );
    setSaved(false);
  }

  function persistFeelings() {
    start(async () => {
      await savePostReflection(comparisonId, selected);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-sage">Decision support</p>
        <h1 className="mt-3 font-serif text-4xl">Conversations worth having</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          These prompts are a guide, not a test of whether you should marry. Mark what you’ve discussed.
        </p>
      </header>

      <div className="space-y-6">
        {prompts.map((prompt) => (
          <article key={prompt.id} className="rounded-3xl border border-line bg-white/50 p-6">
            <p className="text-xs uppercase tracking-wider text-sage">{prompt.category}</p>
            <h2 className="mt-2 font-serif text-2xl">{prompt.title}</h2>
            <p className="mt-3 leading-relaxed text-ink">{prompt.question}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MARKS.map((markOption) => (
                <button
                  key={markOption.id}
                  type="button"
                  onClick={() => mark(prompt.id, markOption.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    local[prompt.id] === markOption.id
                      ? "border-sage bg-sage/10 text-ink"
                      : "border-line text-ink-soft"
                  }`}
                >
                  {markOption.label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      <section>
        <h2 className="font-serif text-3xl">After exploring these areas, how do you feel?</h2>
        <p className="mt-2 text-sm text-ink-soft">Choose any that apply. This is not scored.</p>
        <div className="mt-5 grid gap-2">
          {FEELINGS.map((line) => {
            const on = selected.includes(line);
            return (
              <button
                key={line}
                type="button"
                onClick={() => toggleFeeling(line)}
                className={`rounded-2xl border px-4 py-3 text-left ${
                  on ? "border-sage bg-sage/10" : "border-line bg-white/40"
                }`}
              >
                {line}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={persistFeelings}
          disabled={pending}
          className="mt-5 rounded-full bg-sage px-5 py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {saved ? "Saved" : pending ? "Saving…" : "Save reflection"}
        </button>
      </section>
    </div>
  );
}
