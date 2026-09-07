"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS } from "@/lib/questions/data";
import { QuestionCard } from "@/components/questionnaire/QuestionCard";
import { completeAssessment, saveAnswer } from "@/app/actions/core";
import type { AnswerValue } from "@/lib/types";

export function QuestionnaireClient({
  startIndex,
  saved,
}: {
  startIndex: number;
  saved: Record<string, AnswerValue>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(Math.min(startIndex, QUESTIONS.length - 1));
  const [answers, setAnswers] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const question = QUESTIONS[index];

  function go(nextIndex: number, value: AnswerValue) {
    setError(null);
    startTransition(async () => {
      try {
        await saveAnswer(question.id, value, nextIndex);
        setAnswers((prev) => ({ ...prev, [question.id]: value }));
        if (nextIndex >= QUESTIONS.length) {
          await completeAssessment();
          router.push("/reflection");
          router.refresh();
          return;
        }
        setIndex(nextIndex);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  return (
    <div>
      <QuestionCard
        key={question.id}
        question={question}
        index={index}
        total={QUESTIONS.length}
        sectionLabel={question.sectionTitle}
        initialValue={answers[question.id]}
        onBack={index > 0 ? () => setIndex(index - 1) : undefined}
        onContinue={(value) => go(index + 1, value)}
        saving={pending}
      />
      {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
      <p className="mt-8 text-sm text-ink-soft">Your answers are saved as you continue.</p>
    </div>
  );
}
