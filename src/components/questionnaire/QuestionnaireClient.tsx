"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard } from "@/components/questionnaire/QuestionCard";
import { completeAssessment, saveAnswer } from "@/app/actions/core";
import { visibleQuestions } from "@/lib/questions/visibility";
import type { AnswerValue } from "@/lib/types";

export function QuestionnaireClient({
  startIndex,
  saved,
}: {
  startIndex: number;
  saved: Record<string, AnswerValue>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(saved);
  const visible = visibleQuestions(answers);
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(visible.length - 1, 0)));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const safeIndex = Math.min(index, Math.max(visible.length - 1, 0));
  const question = visible[safeIndex];

  function go(value: AnswerValue) {
    if (!question) return;
    const nextAnswers = { ...answers, [question.id]: value };
    const nextVisible = visibleQuestions(nextAnswers);
    const pos = nextVisible.findIndex((item) => item.id === question.id);
    const nextPos = pos + 1;
    setError(null);
    startTransition(async () => {
      try {
        await saveAnswer(question.id, value, nextPos);
        setAnswers(nextAnswers);
        if (nextPos >= nextVisible.length) {
          await completeAssessment();
          router.push("/reflection");
          router.refresh();
          return;
        }
        setIndex(nextPos);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  if (!question) return null;

  return (
    <div>
      <QuestionCard
        key={question.id}
        question={question}
        index={safeIndex}
        total={visible.length}
        sectionLabel={question.sectionTitle}
        initialValue={answers[question.id]}
        onBack={safeIndex > 0 ? () => setIndex(safeIndex - 1) : undefined}
        onContinue={go}
        saving={pending}
      />
      {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}
      <p className="mt-8 text-sm text-ink-soft">Your answers are saved as you continue.</p>
    </div>
  );
}
