"use client";

import { useState } from "react";
import { QuestionCard } from "@/components/questionnaire/QuestionCard";
import { visibleQuestions } from "@/lib/questions/visibility";
import type { AnswerValue } from "@/lib/types";

export function QuestionnairePreview() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [done, setDone] = useState(false);
  const visible = visibleQuestions(answers);
  const safeIndex = Math.min(index, Math.max(visible.length - 1, 0));
  const question = visible[safeIndex];

  if (done || !question) {
    return (
      <p className="rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-ink-soft">
        Preview complete. These answers stayed in this browser tab and were not saved.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-6 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-ink-soft">
        Preview only — answers stay in this browser tab and are not saved to an account.
      </p>
      <QuestionCard
        key={question.id}
        question={question}
        index={safeIndex}
        total={visible.length}
        sectionLabel={question.sectionTitle}
        initialValue={answers[question.id]}
        onBack={safeIndex > 0 ? () => setIndex(safeIndex - 1) : undefined}
        onContinue={(value) => {
          const nextAnswers = { ...answers, [question.id]: value };
          const nextVisible = visibleQuestions(nextAnswers);
          const pos = nextVisible.findIndex((item) => item.id === question.id);
          setAnswers(nextAnswers);
          if (pos + 1 >= nextVisible.length) setDone(true);
          else setIndex(pos + 1);
        }}
      />
    </div>
  );
}
