"use client";

import { useState } from "react";
import type { AnswerValue, ImportanceLevel, Question } from "@/lib/types";
import { IMPORTANCE_LABELS } from "@/lib/types";
import { isAnswerComplete } from "@/lib/engine/tags-from-answers";
import { Button } from "@/components/ui/Button";

export function QuestionCard({
  question,
  index,
  total,
  sectionLabel,
  initialValue,
  onBack,
  onContinue,
  saving,
}: {
  question: Question;
  index: number;
  total: number;
  sectionLabel: string;
  initialValue?: AnswerValue;
  onBack?: () => void;
  onContinue: (value: AnswerValue) => void;
  saving?: boolean;
}) {
  const [value, setValue] = useState<AnswerValue | undefined>(
    initialValue ?? (question.type === "reflection" ? { kind: "text", text: "" } : undefined),
  );
  const complete =
    isAnswerComplete(question.id, value) || (!question.required && question.type === "reflection");

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-sage">{sectionLabel}</p>
        <div className="mt-3 h-1 rounded-full bg-paper-deep">
          <div className="h-1 rounded-full bg-sage transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          {index + 1} of {total}
        </p>
      </div>
      <h1 className="font-serif text-3xl leading-snug text-ink">{question.question}</h1>
      {question.helper ? <p className="mt-3 text-ink-soft">{question.helper}</p> : null}
      <div className="mt-8">
        <Fields question={question} value={value} onChange={setValue} />
      </div>
      <div className="mt-10 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={!onBack || saving}>
          Back
        </Button>
        <Button type="button" onClick={() => value && onContinue(value)} disabled={!complete || saving || !value}>
          {saving ? "Saving…" : index + 1 === total ? "Finish" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function Fields({
  question,
  value,
  onChange,
}: {
  question: Question;
  value?: AnswerValue;
  onChange: (value: AnswerValue) => void;
}) {
  if (question.type === "ranking") {
    const selected = value?.kind === "ranking" ? value.orderedIds : [];
    const need = question.rankCount ?? 4;
    return (
      <div>
        <p className="mb-4 text-sm text-ink-soft">Select {need} in order of importance.</p>
        <ol className="mb-4 space-y-2 text-sm text-sage">
          {selected.map((id, i) => (
            <li key={id}>
              {i + 1}. {question.options?.find((o) => o.id === id)?.label}
            </li>
          ))}
        </ol>
        <div className="grid gap-2">
          {question.options?.map((option) => {
            const rank = selected.indexOf(option.id);
            const chosen = rank >= 0;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (chosen) onChange({ kind: "ranking", orderedIds: selected.filter((id) => id !== option.id) });
                  else if (selected.length < need) onChange({ kind: "ranking", orderedIds: [...selected, option.id] });
                }}
                className={`rounded-2xl border px-4 py-3 text-left ${chosen ? "border-sage bg-sage/10" : "border-line bg-white/40 hover:border-sage/40"}`}
              >
                <span className="text-ink">{option.label}</span>
                {chosen ? <span className="ml-2 text-sm text-sage">#{rank + 1}</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "multi_select") {
    const selected = value?.kind === "multi" ? value.optionIds : [];
    const max = question.maxSelect ?? 3;
    return (
      <div className="grid gap-2">
        {question.options?.map((option) => {
          const chosen = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                if (chosen) onChange({ kind: "multi", optionIds: selected.filter((id) => id !== option.id) });
                else if (selected.length < max) onChange({ kind: "multi", optionIds: [...selected, option.id] });
              }}
              className={`rounded-2xl border px-4 py-3 text-left ${chosen ? "border-sage bg-sage/10" : "border-line bg-white/40 hover:border-sage/40"}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "importance_scale") {
    const ratings = value?.kind === "importance" ? value.ratings : {};
    const levels: ImportanceLevel[] = ["non_negotiable", "important_flexible", "not_particularly_important"];
    return (
      <div className="space-y-6">
        {question.items?.map((item) => (
          <div key={item.id} className="rounded-2xl border border-line bg-white/40 p-4">
            <p className="mb-3 text-ink">{item.label}</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {levels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => onChange({ kind: "importance", ratings: { ...ratings, [item.id]: level } })}
                  className={`rounded-xl border px-3 py-2 text-sm ${ratings[item.id] === level ? "border-sage bg-sage/10" : "border-line hover:border-sage/40"}`}
                >
                  {IMPORTANCE_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "reflection") {
    const text = value?.kind === "text" ? value.text : "";
    return (
      <textarea
        value={text}
        onChange={(e) => onChange({ kind: "text", text: e.target.value })}
        rows={5}
        className="w-full rounded-2xl border border-line bg-white/60 px-4 py-3 outline-none focus:border-sage"
        placeholder="Write as little or as much as you like."
      />
    );
  }

  const selected = value?.kind === "single" ? value.optionId : undefined;
  return (
    <div className="grid gap-2">
      {question.options?.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange({ kind: "single", optionId: option.id })}
          className={`rounded-2xl border px-4 py-3 text-left ${selected === option.id ? "border-sage bg-sage/10" : "border-line bg-white/40 hover:border-sage/40"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
