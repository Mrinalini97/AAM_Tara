"use client";

import { useState } from "react";
import { QUESTIONS } from "@/lib/questions/data";
import { QuestionCard } from "@/components/questionnaire/QuestionCard";
import type { AnswerValue } from "@/lib/types";

export function QuestionnairePreview() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const question = QUESTIONS[index];

  return (
    <div>
      <p className="mb-6 rounded-2xl border border-line bg-white/50 px-4 py-3 text-sm text-ink-soft">
        Preview only — answers stay in this browser tab and are not saved to an account.
      </p>
      <QuestionCard
        key={question.id}
        question={question}
        index={index}
        total={QUESTIONS.length}
        sectionLabel={question.sectionTitle}
        initialValue={answers[question.id]}
        onBack={index > 0 ? () => setIndex(index - 1) : undefined}
        onContinue={(value) => {
          setAnswers((prev) => ({ ...prev, [question.id]: value }));
          if (index + 1 < QUESTIONS.length) setIndex(index + 1);
        }}
      />
    </div>
  );
}
